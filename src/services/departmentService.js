import { apiService } from './apiService';

export const departmentService = {
  async getDepartments() {
    try {
      const departments = await apiService.get('/departments');
      console.log(`✅ Loaded ${departments.length} departments`);
      return departments;
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      // Return comprehensive fallback departments
      return [
        { 
          _id: '1', 
          name: 'General OPD', 
          code: 'general', 
          waitingCount: 5,
          servedToday: 12,
          activeCounters: 2,
          estimatedWaitTime: 15,
          active: true
        },
        { 
          _id: '2', 
          name: 'Cardiology', 
          code: 'cardiology', 
          waitingCount: 3,
          servedToday: 8,
          activeCounters: 1,
          estimatedWaitTime: 25,
          active: true
        },
        { 
          _id: '3', 
          name: 'Orthopedics', 
          code: 'ortho', 
          waitingCount: 2,
          servedToday: 6,
          activeCounters: 1,
          estimatedWaitTime: 20,
          active: true
        },
        { 
          _id: '4', 
          name: 'Pediatrics', 
          code: 'pediatrics', 
          waitingCount: 4,
          servedToday: 10,
          activeCounters: 1,
          estimatedWaitTime: 10,
          active: true
        },
        { 
          _id: '5', 
          name: 'Emergency', 
          code: 'emergency', 
          waitingCount: 1,
          servedToday: 15,
          activeCounters: 2,
          estimatedWaitTime: 0,
          active: true
        }
      ];
    }
  },

  async getDepartmentByCode(code) {
    try {
      const departments = await this.getDepartments();
      const department = departments.find(dept => dept.code === code);
      if (!department) {
        console.warn(`Department with code ${code} not found, returning first department`);
        return departments[0];
      }
      return department;
    } catch (error) {
      console.error('Error fetching department by code:', error);
      // Return fallback
      return { 
        _id: '1', 
        name: 'General OPD', 
        code: 'general',
        estimatedWaitTime: 15
      };
    }
  },

  async getQueue(departmentId) {
    try {
      const queue = await apiService.get(`/departments/${departmentId}/queue`);
      console.log(`✅ Queue loaded for department ${departmentId}: ${queue.length} tickets`);
      return queue;
    } catch (error) {
      console.error('Error fetching department queue:', error);
      // Generate mock queue data
      return this.generateMockQueue(departmentId);
    }
  },

  async getDepartmentStats(departmentId) {
    try {
      const stats = await apiService.get(`/departments/${departmentId}/stats`);
      return stats;
    } catch (error) {
      console.error('Error fetching department stats:', error);
      return { 
        waitingCount: 0, 
        avgWaitTime: 15,
        servedToday: 0,
        totalServed: 0
      };
    }
  },

  async updateDepartment(departmentId, data) {
    try {
      const result = await apiService.put(`/departments/${departmentId}`, data);
      console.log(`✅ Department ${departmentId} updated successfully`);
      return result;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },

  // Helper method to generate mock queue data
  generateMockQueue(departmentId) {
    const departments = {
      '1': { prefix: 'G', name: 'General OPD' },
      '2': { prefix: 'C', name: 'Cardiology' },
      '3': { prefix: 'O', name: 'Orthopedics' },
      '4': { prefix: 'P', name: 'Pediatrics' },
      '5': { prefix: 'EM', name: 'Emergency' }
    };

    const dept = departments[departmentId] || departments['1'];
    const queueSize = Math.floor(Math.random() * 8) + 2; // 2-10 tickets
    
    const tickets = [];
    for (let i = 1; i <= queueSize; i++) {
      tickets.push({
        _id: `mock_${departmentId}_${i}`,
        ticketNumber: `${dept.prefix}${(100 + i).toString().padStart(3, '0')}`,
        department: { 
          _id: departmentId, 
          name: dept.name,
          prefix: dept.prefix
        },
        generatedAt: new Date(Date.now() - i * 5 * 60000), // 5 minutes apart
        status: 'waiting',
        priority: i === 1 ? 'priority' : 'normal',
        patientName: i === 1 ? 'Priority Patient' : null,
        estimatedWaitTime: Math.floor(Math.random() * 30) + 10,
        positionInQueue: i
      });
    }

    console.log(`📝 Generated mock queue for ${dept.name}: ${tickets.length} tickets`);
    return tickets;
  },

  // Get all departments including inactive (for admin)
  async getAllDepartments() {
    try {
      const departments = await apiService.get('/departments/all');
      return departments;
    } catch (error) {
      console.error('Error fetching all departments:', error);
      return this.getDepartments(); // Fallback to active departments
    }
  }
};