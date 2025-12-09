import { apiService } from './apiService';

export const counterService = {
  /** 
   * Fetch a specific counter by ID 
   */
  async getCounter(counterId) {
    try {
      console.log(`📥 Fetching counter ${counterId}...`);
      const counter = await apiService.get(`/counters/${counterId}`);
      console.log(`✅ Counter ${counterId} loaded successfully`, counter);
      return counter;
    } catch (error) {
      console.error('❌ Error fetching counter:', error);
      throw error;
    }
  },

  /** 
   * Fetch detailed counter info with queue
   */
  async getCounterDetails(counterId) {
    try {
      console.log(`📥 Fetching detailed counter info for ${counterId}...`);
      const details = await apiService.get(`/counters/${counterId}/full-details`);
      console.log(`✅ Counter details loaded successfully`, details);
      return details;
    } catch (error) {
      console.error('❌ Error fetching counter details:', error);
      throw error;
    }
  },

  /** 
   * Get list of all active counters 
   */
  async getActiveCounters() {
    try {
      console.log('📥 Fetching active counters...');
      const counters = await apiService.get('/counters/status/active');
      console.log(`✅ ${counters.length} active counters loaded`);
      return counters;
    } catch (error) {
      console.error('❌ Error fetching active counters:', error);
      // Return fallback data
      return [
        {
          _id: '1',
          counterNumber: 1,
          status: 'active',
          department: { name: 'General OPD', code: 'general' },
          currentTicket: null
        }
      ];
    }
  },

  /** 
   * Get the next available ticket for a department 
   */
  async getNextTicket(departmentId) {
    try {
      console.log(`📥 Fetching next ticket for department ${departmentId}...`);
      const tickets = await apiService.get(`/departments/${departmentId}/queue`);
      const nextTicket = tickets.length > 0 ? tickets[0] : null;
      console.log(`✅ Next ticket:`, nextTicket?.ticketNumber || 'No tickets');
      return nextTicket;
    } catch (error) {
      console.error('❌ Error fetching next ticket:', error);
      throw error;
    }
  },

  /** 
   * Get the full queue of a department 
   */
  async getQueue(departmentId) {
    try {
      console.log(`📥 Fetching queue for department ${departmentId}...`);
      const queue = await apiService.get(`/departments/${departmentId}/queue`);
      console.log(`✅ Queue loaded: ${queue.length} tickets waiting`);
      return queue;
    } catch (error) {
      console.error('❌ Error fetching queue:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  /** 
   * Call the next ticket at a counter 
   */
  async callNextTicket(counterId) {
    try {
      console.log(`📞 Calling next ticket for counter ${counterId}...`);
      const result = await apiService.post(`/counters/${counterId}/call-next`);
      console.log('✅ Next ticket called successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error calling next ticket:', error);
      throw error;
    }
  },

  /** 
   * Mark the current ticket as completed 
   */
  async completeTicket(counterId) {
    try {
      console.log(`✅ Completing current ticket for counter ${counterId}...`);
      const result = await apiService.post(`/counters/${counterId}/complete`);
      console.log('✅ Ticket completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Error completing ticket:', error);
      throw error;
    }
  },

  /** 
   * Recall the last called ticket 
   */
  async recallTicket(counterId) {
    try {
      console.log(`🔁 Recalling ticket for counter ${counterId}...`);
      const result = await apiService.post(`/counters/${counterId}/recall`);
      console.log('✅ Ticket recalled successfully');
      return result;
    } catch (error) {
      console.error('❌ Error recalling ticket:', error);
      throw error;
    }
  },

  /** 
   * Transfer ticket to another department 
   */
  async transferTicket(counterId, newDepartmentId) {
    try {
      console.log(`🔄 Transferring ticket from counter ${counterId} to department ${newDepartmentId}...`);
      const result = await apiService.post(`/counters/${counterId}/transfer`, {
        newDepartmentId
      });
      console.log('✅ Ticket transferred successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error transferring ticket:', error);
      throw error;
    }
  },

  /** 
   * Get all departments
   */
  async getDepartments() {
    try {
      console.log('📥 Fetching all departments...');
      const departments = await apiService.get('/departments');
      console.log(`✅ ${departments.length} departments loaded`);
      return departments;
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      // Return fallback data
      return [
        {
          _id: '1',
          name: 'General OPD',
          code: 'general',
          prefix: 'A',
          description: 'General Outpatient Department'
        },
        {
          _id: '2', 
          name: 'Emergency',
          code: 'emergency',
          prefix: 'E',
          description: 'Emergency Department'
        },
        {
          _id: '3',
          name: 'Cardiology',
          code: 'cardiology', 
          prefix: 'C',
          description: 'Cardiology Department'
        }
      ];
    }
  },

  /** 
   * Call a specific ticket manually 
   */
  async callSpecificTicket(ticketId, counterId) {
    try {
      console.log(`📞 Calling specific ticket ${ticketId} at counter ${counterId}...`);
      const result = await apiService.post('/tickets/call-specific', { 
        ticketId, 
        counterId 
      });
      console.log('✅ Specific ticket called successfully');
      return result;
    } catch (error) {
      console.error('❌ Error calling specific ticket:', error);
      throw error;
    }
  },

  /** 
   * Skip a ticket (move to end of queue)
   */
  async skipTicket(ticketId) {
    try {
      console.log(`⏭️ Skipping ticket ${ticketId}...`);
      const result = await apiService.post(`/tickets/${ticketId}/skip`);
      console.log('✅ Ticket skipped successfully');
      return result;
    } catch (error) {
      console.error('❌ Error skipping ticket:', error);
      throw error;
    }
  },

  /** 
   * Update counter status (active, busy, break, etc.) 
   */
  async updateCounterStatus(counterId, status) {
    try {
      console.log(`🔄 Updating counter ${counterId} status to: ${status}`);
      const result = await apiService.put(`/counters/${counterId}/status`, { status });
      console.log(`✅ Counter status updated to: ${status}`);
      return result;
    } catch (error) {
      console.error('❌ Error updating counter status:', error);
      throw error;
    }
  },

  /** 
   * Get counter statistics 
   */
  async getCounterStats(counterId) {
    try {
      console.log(`📊 Fetching stats for counter ${counterId}...`);
      const stats = await apiService.get(`/counters/${counterId}/stats`);
      console.log('✅ Counter stats loaded successfully');
      return stats;
    } catch (error) {
      console.error('❌ Error fetching counter stats:', error);
      throw error;
    }
  },

  /** 
   * Get all counters
   */
  async getAllCounters() {
    try {
      console.log('📥 Fetching all counters...');
      const counters = await apiService.get('/counters');
      console.log(`✅ ${counters.length} counters loaded`);
      return counters;
    } catch (error) {
      console.error('❌ Error fetching all counters:', error);
      // Return fallback data
      return [
        {
          _id: '1',
          counterNumber: 1,
          name: 'Counter 1',
          status: 'active',
          department: { _id: '1', name: 'General OPD' },
          currentTicket: null
        }
      ];
    }
  },

  /** 
   * Get accessible counters for current user
   */
  async getAccessibleCounters() {
    try {
      console.log('📥 Fetching accessible counters...');
      const result = await apiService.get('/counters/accessible');
      console.log(`✅ ${result.counters?.length || 0} accessible counters loaded`);
      return result.counters || [];
    } catch (error) {
      console.error('❌ Error fetching accessible counters:', error);
      return [];
    }
  }
};