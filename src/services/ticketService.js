import { apiService } from './apiService';

// In-memory storage for local tickets (fallback when API fails)
let localTickets = [];
let localQueues = {};
let departmentSequences = {};

export const ticketService = {
  async generateTicket(ticketData) {
    try {
      console.log('🎫 Generating ticket via API:', ticketData);
      
      // Prepare data for API - FIXED: Send only required fields
      const apiData = {
        departmentId: ticketData.departmentId,
        patientName: ticketData.patientName || null,
        patientPhone: ticketData.patientPhone || null,
        priority: ticketData.priority || 'normal'
      };

      const response = await apiService.post('/tickets/generate', apiData);
      
      if (response.success) {
        console.log('✅ Ticket generated via API:', response.ticket);
        return response.ticket;
      } else {
        throw new Error(response.error || 'Failed to generate ticket');
      }
      
    } catch (error) {
      console.error('❌ API failed, generating ticket locally:', error);
      
      // Generate ticket locally as fallback
      const localTicket = await this.generateLocalTicket(ticketData);
      console.log('📝 Local ticket created:', localTicket);
      
      return localTicket;
    }
  },

  async getDepartments() {
    try {
      const departments = await apiService.get('/departments');
      console.log(`✅ Loaded ${departments.length} departments from API`);
      return departments;
    } catch (error) {
      console.error('❌ Error fetching departments from API, using fallback:', error);
      
      // Enhanced fallback departments with proper sequences
      return [
        { 
          _id: '1', 
          name: 'General OPD', 
          code: 'general', 
          prefix: 'A',  // FIXED: Changed from 'G' to 'A' for A001 format
          estimatedWaitTime: 15,
          active: true,
          waitingCount: 5,
          servedToday: 12,
          currentSequence: 0  // FIXED: Added sequence field
        },
        { 
          _id: '2', 
          name: 'Cardiology', 
          code: 'cardiology', 
          prefix: 'B',  // FIXED: Changed from 'C' to 'B' for B001 format
          estimatedWaitTime: 25,
          active: true,
          waitingCount: 3,
          servedToday: 8,
          currentSequence: 0
        },
        { 
          _id: '3', 
          name: 'Orthopedics', 
          code: 'ortho', 
          prefix: 'C',  // FIXED: Changed from 'O' to 'C' for C001 format
          estimatedWaitTime: 20,
          active: true,
          waitingCount: 2,
          servedToday: 6,
          currentSequence: 0
        }
      ];
    }
  },

  async getQueue(departmentId) {
    try {
      const queue = await apiService.get(`/tickets/queue/${departmentId}`);
      console.log(`✅ Queue loaded from API for department ${departmentId}: ${queue.length} tickets`);
      return queue;
    } catch (error) {
      console.error('❌ Error fetching queue from API, using local queue:', error);
      
      // Return local queue or generate mock data
      const localQueue = localQueues[departmentId] || [];
      if (localQueue.length > 0) {
        console.log(`📋 Using local queue: ${localQueue.length} tickets`);
        return localQueue;
      }
      
      // Generate mock queue if no local data
      return this.generateMockQueue(departmentId);
    }
  },

  // New method for waiting area with enhanced queue data
  async getDepartmentQueue(departmentId) {
    try {
      const response = await apiService.get(`/tickets/department/${departmentId}/queue-enhanced`);
      return response;
    } catch (error) {
      console.error('❌ Error fetching enhanced queue, using basic queue:', error);
      return this.getQueue(departmentId);
    }
  },

  async getLastTicket(departmentId) {
    try {
      // Try to get from API first
      const lastTicket = await apiService.get(`/tickets/department/${departmentId}/last`);
      return lastTicket;
    } catch (error) {
      console.error('Error getting last ticket from API:', error);
      
      // Check local tickets
      const deptTickets = localTickets.filter(t => t.departmentId === departmentId);
      if (deptTickets.length > 0) {
        return deptTickets.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0];
      }
      
      return null;
    }
  },

  async callNextTicket(counterId) {
    try {
      console.log(`📞 Calling next ticket for counter ${counterId} via API...`);
      const result = await apiService.post('/tickets/call-next', { counterId });
      console.log('✅ Next ticket called via API:', result);
      return result;
    } catch (error) {
      console.error('❌ Error calling next ticket via API:', error);
      throw new Error('Failed to call next ticket: ' + (error.message || 'Unknown error'));
    }
  },

  async completeTicket(ticketId) {
    try {
      console.log(`✅ Completing ticket ${ticketId} via API...`);
      const result = await apiService.post(`/tickets/complete/${ticketId}`);
      console.log('✅ Ticket completed via API');
      return result;
    } catch (error) {
      console.error('❌ Error completing ticket via API:', error);
      throw new Error('Failed to complete ticket: ' + (error.message || 'Unknown error'));
    }
  },

  // Local ticket generation (fallback when API fails) - FIXED SEQUENCE
  async generateLocalTicket(ticketData) {
    const { departmentId, departmentName, priority = 'normal' } = ticketData;
    
    // FIXED: Get department info to generate proper ticket number
    const departments = await this.getDepartments();
    const department = departments.find(dept => dept._id === departmentId) || departments[0];
    
    // Initialize sequence for department if not exists
    if (!departmentSequences[departmentId]) {
      // Try to get last ticket to continue sequence
      const lastTicket = await this.getLastTicket(departmentId);
      if (lastTicket && lastTicket.ticketNumber) {
        // Extract number from ticket number (e.g., "A001" -> 1)
        const lastNumber = parseInt(lastTicket.ticketNumber.replace(department.prefix, '')) || 0;
        departmentSequences[departmentId] = lastNumber;
      } else {
        departmentSequences[departmentId] = 0;
      }
    }
    
    // FIXED: Increment sequence and generate proper ticket number
    departmentSequences[departmentId] += 1;
    const ticketNumber = `${department.prefix}${departmentSequences[departmentId].toString().padStart(3, '0')}`;
    
    const currentQueueCount = localQueues[departmentId]?.length || 0;
    const positionInQueue = currentQueueCount + 1;
    
    const ticket = {
      _id: `local_${departmentId}_${Date.now()}`,
      ticketNumber: ticketNumber,
      department: {
        _id: departmentId,
        name: departmentName || department.name,
        prefix: department.prefix
      },
      departmentId: departmentId,
      departmentName: departmentName || department.name,
      generatedAt: new Date(),
      estimatedWaitTime: department.estimatedWaitTime || 15,
      status: 'waiting',
      patientName: ticketData.patientName || null,
      priority: priority,
      positionInQueue: positionInQueue,
      isLocal: true
    };
    
    // Store locally
    this.storeTicketLocally(ticket);
    
    console.log(`✅ Local ticket generated: ${ticketNumber}`);
    return ticket;
  },

  // Store ticket in local storage
  storeTicketLocally(ticket) {
    localTickets.push(ticket);
    
    const deptId = ticket.departmentId || ticket.department?._id;
    if (deptId) {
      if (!localQueues[deptId]) {
        localQueues[deptId] = [];
      }
      localQueues[deptId].push(ticket);
    }
    
    console.log(`💾 Ticket stored locally: ${ticket.ticketNumber}`);
  },

  // Generate mock queue data - FIXED TICKET NUMBER FORMAT
  generateMockQueue(departmentId) {
    const departments = {
      '1': { prefix: 'A', name: 'General OPD' },
      '2': { prefix: 'B', name: 'Cardiology' },
      '3': { prefix: 'C', name: 'Orthopedics' }
    };

    const dept = departments[departmentId] || departments['1'];
    const queueSize = Math.floor(Math.random() * 6) + 3;
    
    const tickets = [];
    for (let i = 1; i <= queueSize; i++) {
      // FIXED: Generate proper ticket numbers like A001, A002, etc.
      const ticketNumber = `${dept.prefix}${i.toString().padStart(3, '0')}`;
      
      tickets.push({
        _id: `mock_${departmentId}_${i}`,
        ticketNumber: ticketNumber,
        department: { 
          _id: departmentId, 
          name: dept.name,
          prefix: dept.prefix
        },
        departmentId: departmentId,
        departmentName: dept.name,
        generatedAt: new Date(Date.now() - i * 5 * 60000),
        status: 'waiting',
        priority: i === 1 ? 'priority' : 'normal',
        patientName: i === 1 ? 'Priority Patient' : `Patient ${i}`,
        estimatedWaitTime: Math.floor(Math.random() * 30) + 10,
        positionInQueue: i,
        isMock: true
      });
    }

    console.log(`🎭 Generated mock queue for ${dept.name}: ${tickets.length} tickets`);
    return tickets;
  },

  // Utility methods
  getLocalTickets() {
    return localTickets;
  },

  getLocalQueues() {
    return localQueues;
  },

  clearLocalData() {
    localTickets = [];
    localQueues = {};
    departmentSequences = {};
    console.log('🧹 Local ticket data cleared');
  }
};

export default ticketService;