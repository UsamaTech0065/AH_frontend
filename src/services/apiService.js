const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
    this.timeout = 30000; // 30 seconds timeout
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    // Default headers (only set JSON if not FormData)
    const defaultHeaders = {};
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    // Add authentication token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    };

    // Stringify body if JSON
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log('📤 API Request →', {
        url,
        method: config.method || 'GET',
        body: config.body instanceof FormData ? '[FormData]' : config.body
      });

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Handle no-content responses
      if (response.status === 204) {
        console.log('✅ API Response → 204 No Content');
        return { success: true, message: 'Operation completed successfully' };
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      console.log('✅ API Response →', {
        status: response.status,
        data: data instanceof Blob ? '[Blob]' : data
      });

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ API Request Failed:', {
        url,
        error: error.name,
        message: error.message
      });

      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  // ==================== BASIC HTTP METHODS ====================
  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: data });
  }

  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: data });
  }

  patch(endpoint, data) {
    return this.request(endpoint, { method: 'PATCH', body: data });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ==================== DATA MANAGEMENT METHODS ====================
  async deleteAllData(confirmationToken = null) {
    const payload = {};
    
    if (confirmationToken) {
      payload.confirmationToken = confirmationToken;
    }
    
    console.log('🗑️  DELETE ALL DATA REQUEST →', { 
      hasConfirmationToken: !!confirmationToken 
    });
    
    return this.request('/admin/delete-all-data', {
      method: 'DELETE',
      body: Object.keys(payload).length > 0 ? payload : undefined
    });
  }

  async deleteAllDataWithConfirmation(confirmationPhrase = "DELETE ALL DATA") {
    console.warn('⚠️  CONFIRMING DELETE ALL DATA →', { confirmationPhrase });
    
    return this.request('/admin/delete-all-data', {
      method: 'DELETE',
      body: { 
        confirmation: confirmationPhrase,
        timestamp: new Date().toISOString()
      }
    });
  }

  async deleteDataByType(dataType, options = {}) {
    const validTypes = ['tickets', 'counters', 'departments', 'settings', 'logs', 'all'];
    
    if (!validTypes.includes(dataType)) {
      throw new Error(`Invalid data type: ${dataType}. Must be one of: ${validTypes.join(', ')}`);
    }

    console.log(`🗑️  DELETE DATA BY TYPE →`, { 
      dataType, 
      options 
    });

    return this.request(`/admin/data/${dataType}`, {
      method: 'DELETE',
      body: options
    });
  }

  async getDataStats() {
    return this.get('/admin/data-stats');
  }

  async backupData() {
    console.log('💾 CREATING DATA BACKUP →');
    return this.post('/admin/backup');
  }

  async restoreData(backupId) {
    console.log('🔄 RESTORING DATA FROM BACKUP →', { backupId });
    return this.post('/admin/restore', { backupId });
  }

  async exportData(format = 'json') {
    const validFormats = ['json', 'csv', 'excel'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`);
    }

    console.log('📤 EXPORTING DATA →', { format });
    
    const response = await this.request(`/admin/export?format=${format}`);
    
    // Handle file download
    if (response instanceof Blob) {
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-backup-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
    
    return response;
  }

  // ==================== FILE UPLOAD METHODS ====================
  async upload(endpoint, formData, onProgress = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${this.baseUrl}${endpoint}`;

      // Add authentication token if available
      const token = localStorage.getItem('authToken');
      if (token) {
        // For XHR, we need to handle auth differently or use headers
        // This will be handled by the browser automatically if using cookies
      }

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            let response;
            const contentType = xhr.getResponseHeader('content-type');
            
            if (contentType?.includes('application/json')) {
              response = JSON.parse(xhr.responseText);
            } else {
              response = xhr.responseText;
            }

            console.log('✅ Upload Success →', { status: xhr.status, response });
            resolve(response);
          } catch (error) {
            console.error('❌ Upload Parse Error:', error);
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          let errorMessage = `Upload failed: ${xhr.status}`;
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Ignore parse error for error response
          }
          console.error('❌ Upload Failed →', { status: xhr.status, error: errorMessage });
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        console.error('❌ Upload Network Error');
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        console.warn('⚠️ Upload Aborted');
        reject(new Error('Upload cancelled'));
      });

      xhr.timeout = this.timeout;
      xhr.ontimeout = () => {
        console.error('❌ Upload Timeout');
        reject(new Error('Upload timeout'));
      };

      console.log('📤 Upload Start →', { url, fileCount: formData.getAll('files').length });
      xhr.open('POST', url);
      xhr.send(formData);
    });
  }

  postFormData(endpoint, formData, onProgress = null) {
    return this.upload(endpoint, formData, onProgress);
  }

  putFormData(endpoint, formData, onProgress = null) {
    // For PUT with FormData, we'll use fetch with override
    const url = `${this.baseUrl}${endpoint}`;
    return fetch(url, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  }

  // ==================== SPECIFIC UPLOAD METHODS ====================
  async uploadWithRetry(endpoint, formData, maxRetries = 3, onProgress = null) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`);
        const result = await this.upload(endpoint, formData, onProgress);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Upload attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // ==================== BATCH REQUESTS ====================
  async batchRequests(requests) {
    const results = [];
    
    for (const request of requests) {
      try {
        const result = await this.request(request.endpoint, request.options);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }

  async concurrentRequests(requests, maxConcurrent = 5) {
    const results = [];
    
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map(request => this.request(request.endpoint, request.options))
      );
      
      results.push(...batchResults.map((result, index) => ({
        request: batch[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      })));
    }
    
    return results;
  }

  // ==================== HEALTH CHECK ====================
  async healthCheck() {
    try {
      const response = await this.request('/health', { timeout: 5000 });
      return { healthy: true, response };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  // ==================== CACHE MANAGEMENT ====================
  async getWithCache(endpoint, cacheKey, ttl = 5 * 60 * 1000) { // 5 minutes default
    const cached = this.getFromCache(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log('💾 Using cached data for:', cacheKey);
      return cached.data;
    }

    const data = await this.get(endpoint);
    this.setCache(cacheKey, data);
    return data;
  }

  getFromCache(key) {
    try {
      const cached = localStorage.getItem(`api_cache_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  setCache(key, data) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  clearCache(pattern = null) {
    try {
      if (pattern) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`api_cache_${pattern}`)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('api_cache_')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  // ==================== ERROR HANDLING UTILITIES ====================
  isNetworkError(error) {
    return error.message.includes('Network') || 
           error.message.includes('fetch') ||
           error.message.includes('timeout');
  }

  isServerError(error) {
    return error.message.includes('HTTP error') ||
           error.message.includes('status: 5');
  }

  isAuthError(error) {
    return error.message.includes('401') ||
           error.message.includes('403') ||
           error.message.includes('authentication') ||
           error.message.includes('authorization');
  }

  // ==================== REQUEST INTERCEPTORS ====================
  addRequestInterceptor(interceptor) {
    if (!this.requestInterceptors) {
      this.requestInterceptors = [];
    }
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor) {
    if (!this.responseInterceptors) {
      this.responseInterceptors = [];
    }
    this.responseInterceptors.push(interceptor);
  }

  async executeRequestInterceptors(config) {
    if (!this.requestInterceptors) return config;
    
    let currentConfig = config;
    for (const interceptor of this.requestInterceptors) {
      currentConfig = await interceptor(currentConfig);
    }
    return currentConfig;
  }

  async executeResponseInterceptors(response) {
    if (!this.responseInterceptors) return response;
    
    let currentResponse = response;
    for (const interceptor of this.responseInterceptors) {
      currentResponse = await interceptor(currentResponse);
    }
    return currentResponse;
  }

  // ==================== SETTINGS SPECIFIC METHODS ====================
  async uploadLogo(formData, onProgress = null) {
    return this.upload('/settings/upload-logo', formData, onProgress);
  }

  async uploadBackground(formData, screenType, onProgress = null) {
    // Add screenType to formData if not already present
    if (!formData.get('screenType')) {
      formData.append('screenType', screenType);
    }
    return this.upload('/settings/upload-background', formData, onProgress);
  }

  async uploadVideo(formData, onProgress = null) {
    return this.upload('/settings/upload-video', formData, onProgress);
  }

  async deleteLogo() {
    return this.delete('/settings/logo');
  }

  async deleteBackground(screenType) {
    return this.delete(`/settings/background/${screenType}`);
  }

  async getSettings() {
    return this.getWithCache('/settings', 'system_settings', 2 * 60 * 1000); // 2 minutes cache
  }

  async updateSettings(settings) {
    // Clear settings cache when updating
    this.clearCache('system_settings');
    return this.put('/settings', settings);
  }

  async updateAdvertisements(advertisements) {
    return this.put('/settings/advertisements', { advertisements });
  }

  async resetSystem() {
    this.clearCache(); // Clear all cache on system reset
    return this.post('/settings/reset');
  }

  // ==================== CONNECTION MANAGEMENT ====================
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  setTimeout(timeout) {
    this.timeout = timeout;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  // ==================== MOCK MODE FOR TESTING ====================
  enableMockMode() {
    this.mockMode = true;
    console.warn('⚠️ Mock mode enabled - API calls will return mock data');
  }

  disableMockMode() {
    this.mockMode = false;
    console.warn('✅ Mock mode disabled - Using real API');
  }
}

// Create global instance
export const apiService = new ApiService();

// Export the class for testing or custom instances
export { ApiService };

// Default interceptors for common use cases
apiService.addRequestInterceptor(async (config) => {
  // Add request timestamp
  config.headers['X-Request-Timestamp'] = Date.now();
  return config;
});

apiService.addResponseInterceptor(async (response) => {
  // Log successful responses
  if (response && typeof response === 'object') {
    console.log('🔧 Response Interceptor →', {
      timestamp: new Date().toISOString(),
      hasData: !!response
    });
  }
  return response;
});