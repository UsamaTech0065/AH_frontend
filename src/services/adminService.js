import { apiService } from './apiService';

export const adminService = {
  async getStats() {
    try {
      return await apiService.get('/analytics/stats');
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Return fallback data
      return {
        totalWaiting: 0,
        servedToday: 0,
        avgWaitTime: 0,
        activeCounters: 0
      };
    }
  },

  async getDepartments() {
    try {
      return await apiService.get('/departments');
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Return fallback departments
      return [
        { _id: '1', name: 'General OPD', waitingCount: 0, estimatedWaitTime: 15 },
        { _id: '2', name: 'Cardiology', waitingCount: 0, estimatedWaitTime: 25 },
        { _id: '3', name: 'Orthopedics', waitingCount: 0, estimatedWaitTime: 20 }
      ];
    }
  },

  async getCounters() {
    try {
      return await apiService.get('/counters');
    } catch (error) {
      console.error('Error fetching counters:', error);
      // Return fallback counters
      return Array.from({ length: 10 }, (_, i) => ({
        _id: `counter-${i + 1}`,
        counterNumber: i + 1,
        name: `Counter ${i + 1}`,
        status: 'active',
        department: { name: 'General OPD' },
        currentTicket: null
      }));
    }
  },

  async getActivities(limit = 50) {
    try {
      return await apiService.get(`/activities?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  },

  async getQueue(departmentId) {
    try {
      return await apiService.get(`/departments/${departmentId}/queue`);
    } catch (error) {
      console.error('Error fetching queue:', error);
      return [];
    }
  },

  async updateCounterStatus(counterId, status) {
    try {
      return await apiService.put(`/counters/${counterId}/status`, { status });
    } catch (error) {
      console.error('Error updating counter status:', error);
      throw error;
    }
  },

  async callNextTicket(counterId) {
    try {
      return await apiService.post(`/counters/${counterId}/call-next`);
    } catch (error) {
      console.error('Error calling next ticket:', error);
      throw error;
    }
  },

  async completeTicket(counterId) {
    try {
      return await apiService.post(`/counters/${counterId}/complete`);
    } catch (error) {
      console.error('Error completing ticket:', error);
      throw error;
    }
  },

  async recallTicket(counterId) {
    try {
      return await apiService.post(`/counters/${counterId}/recall`);
    } catch (error) {
      console.error('Error recalling ticket:', error);
      throw error;
    }
  },

  async createCounter(counterData) {
    try {
      return await apiService.post('/counters', counterData);
    } catch (error) {
      console.error('Error creating counter:', error);
      throw error;
    }
  },

  async deleteCounter(counterId) {
    try {
      return await apiService.delete(`/counters/${counterId}`);
    } catch (error) {
      console.error('Error deleting counter:', error);
      throw error;
    }
  },

  async callSpecificTicket(ticketId, counterId) {
    try {
      return await apiService.post('/tickets/call-specific', { ticketId, counterId });
    } catch (error) {
      console.error('Error calling specific ticket:', error);
      throw error;
    }
  },

  async skipTicket(ticketId) {
    try {
      return await apiService.post(`/tickets/${ticketId}/skip`);
    } catch (error) {
      console.error('Error skipping ticket:', error);
      throw error;
    }
  },

  async generateReport(filters) {
    try {
      return await apiService.post('/analytics/reports', filters);
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  // Department management methods
  async createDepartment(departmentData) {
    try {
      return await apiService.post('/departments', departmentData);
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },

  async deleteDepartment(departmentId) {
    try {
      return await apiService.delete(`/departments/${departmentId}`);
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },

  async updateDepartment(departmentId, data) {
    try {
      return await apiService.put(`/departments/${departmentId}`, data);
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },

  // Additional methods for comprehensive department management
  async getDepartmentStats(departmentId) {
    try {
      return await apiService.get(`/departments/${departmentId}/stats`);
    } catch (error) {
      console.error('Error fetching department stats:', error);
      throw error;
    }
  },

  async reassignCounter(counterId, newDepartmentId) {
    try {
      return await apiService.put(`/counters/${counterId}/department`, {
        departmentId: newDepartmentId
      });
    } catch (error) {
      console.error('Error reassigning counter:', error);
      throw error;
    }
  },

  // Token management methods
  async getActiveTickets() {
    try {
      return await apiService.get('/tickets/active');
    } catch (error) {
      console.error('Error fetching active tickets:', error);
      throw error;
    }
  },

  async transferTicket(ticketId, newDepartmentId) {
    try {
      return await apiService.put(`/tickets/${ticketId}/transfer`, {
        departmentId: newDepartmentId
      });
    } catch (error) {
      console.error('Error transferring ticket:', error);
      throw error;
    }
  },

  async cancelTicket(ticketId) {
    try {
      return await apiService.post(`/tickets/${ticketId}/cancel`);
    } catch (error) {
      console.error('Error canceling ticket:', error);
      throw error;
    }
  },

  // System management methods
  async getSystemLogs(limit = 100) {
    try {
      return await apiService.get(`/system/logs?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      throw error;
    }
  },

  async clearOldData(days = 30) {
    try {
      return await apiService.delete(`/system/clear-old-data?days=${days}`);
    } catch (error) {
      console.error('Error clearing old data:', error);
      throw error;
    }
  },

  // Backup and restore methods
  async createBackup() {
    try {
      return await apiService.post('/system/backup');
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  async restoreBackup(backupData) {
    try {
      return await apiService.post('/system/restore', backupData);
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }
};