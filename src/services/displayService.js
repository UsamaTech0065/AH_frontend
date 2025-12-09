import { apiService } from './apiService';

export const displayService = {
  /** 
   * Get a single display configuration by ID 
   */
  async getDisplay(displayId) {
    try {
      console.log(`📺 Fetching display configuration for ${displayId}...`);
      const display = await apiService.get(`/displays/${displayId}`);
      console.log('✅ Display configuration loaded:', display);
      return display;
    } catch (error) {
      console.error('❌ Error fetching display configuration:', error);

      // Enhanced fallback display data
      return {
        _id: displayId,
        displayId: displayId,
        name: 'Waiting Area Display',
        type: 'waiting',
        location: 'Main Hall',
        settings: {
          showLogo: true,
          showAds: true,
          theme: 'default',
          customMessage: 'Welcome to Razi Hospital - Quality Healthcare Services',
          adInterval: 30,
          backgroundColor: '#1a5276',
          textColor: '#ffffff',
          fontSize: 'medium'
        },
        active: true,
        lastUpdated: new Date()
      };
    }
  },

  /** 
   * Get display live data (tickets, counters, etc.)
   */
  async getDisplayData(displayId) {
    try {
      console.log(`📊 Fetching live data for display ${displayId}...`);
      const data = await apiService.get(`/displays/${displayId}/data`);
      
      // Ensure all required fields exist and filter active counters
      if (data.counters && Array.isArray(data.counters)) {
        const activeCounters = data.counters.filter(counter => 
          counter && (counter.status === 'active' || counter.status === 'busy')
        );
        console.log(`✅ Filtered ${activeCounters.length} active counters from ${data.counters.length} total`);
        data.counters = activeCounters;
      }
      
      // Ensure arrays exist
      data.currentTickets = data.currentTickets || [];
      data.departmentCounts = data.departmentCounts || [];
      data.counters = data.counters || [];
      
      console.log('✅ Display data loaded successfully:', {
        currentTickets: data.currentTickets.length,
        departmentCounts: data.departmentCounts.length,
        counters: data.counters.length
      });
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching display data:', error);

      // Enhanced fallback demo data
      const fallbackCounters = [
        {
          _id: 'counter-1',
          counterNumber: 1,
          status: 'busy',
          name: 'Counter 01',
          currentTicket: {
            _id: 'ticket-1',
            ticketNumber: 'G101',
            patientName: 'John Doe',
            calledAt: new Date(),
            department: { name: 'General OPD', code: 'general' }
          },
          department: { 
            name: 'General OPD', 
            code: 'general',
            prefix: 'G'
          },
        },
        {
          _id: 'counter-2',
          counterNumber: 2,
          status: 'active',
          name: 'Counter 02',
          currentTicket: null,
          department: { 
            name: 'Cardiology', 
            code: 'cardiology',
            prefix: 'C'
          },
        },
        {
          _id: 'counter-3',
          counterNumber: 3,
          status: 'busy',
          name: 'Counter 03',
          currentTicket: {
            _id: 'ticket-2',
            ticketNumber: 'O205',
            patientName: 'Jane Smith',
            calledAt: new Date(Date.now() - 5 * 60000),
            department: { name: 'Orthopedics', code: 'ortho' }
          },
          department: { 
            name: 'Orthopedics', 
            code: 'ortho',
            prefix: 'O'
          },
        }
      ];

      const fallbackData = {
        currentTickets: [
          {
            _id: 'current-1',
            ticketNumber: 'G101',
            department: { name: 'General OPD', code: 'general' },
            assignedCounter: { counterNumber: 1, name: 'Counter 01' },
            calledAt: new Date(),
            patientName: 'John Doe'
          },
          {
            _id: 'current-2',
            ticketNumber: 'O205',
            department: { name: 'Orthopedics', code: 'ortho' },
            assignedCounter: { counterNumber: 3, name: 'Counter 03' },
            calledAt: new Date(Date.now() - 5 * 60000),
            patientName: 'Jane Smith'
          }
        ],
        departmentCounts: [
          { _id: '1', name: 'General OPD', waitingCount: 8 },
          { _id: '2', name: 'Cardiology', waitingCount: 4 },
          { _id: '3', name: 'Orthopedics', waitingCount: 3 },
          { _id: '4', name: 'Pediatrics', waitingCount: 6 },
          { _id: '5', name: 'Emergency', waitingCount: 1 }
        ],
        counters: fallbackCounters,
        display: {
          _id: displayId,
          name: 'Waiting Area Display',
          type: 'waiting',
          settings: {
            showLogo: true,
            showAds: true,
            theme: 'default',
            customMessage: 'Please wait for your number to be called',
            adInterval: 30,
          },
        },
        lastUpdated: new Date(),
        isFallbackData: true
      };

      console.log('📋 Using enhanced fallback display data');
      return fallbackData;
    }
  },

  /** 
   * Update display configuration 
   */
  async updateDisplay(displayId, settings) {
    try {
      console.log(`⚙️ Updating display ${displayId} settings...`);
      const result = await apiService.put(`/displays/${displayId}`, settings);
      console.log('✅ Display settings updated successfully');
      return result;
    } catch (error) {
      console.error('❌ Error updating display:', error);
      throw error;
    }
  },

  /** 
   * Get all available displays 
   */
  async getAllDisplays() {
    try {
      console.log('📺 Fetching all displays...');
      const displays = await apiService.get('/displays');
      console.log(`✅ ${displays.length} displays loaded`);
      return displays;
    } catch (error) {
      console.error('❌ Error fetching displays:', error);

      // Enhanced fallback example displays
      return [
        {
          _id: 'main-waiting',
          displayId: 'main-waiting',
          name: 'Main Waiting Area Display',
          type: 'waiting',
          location: 'Main Hall',
          settings: {
            theme: 'default',
            showAds: true,
            showLogo: true,
            customMessage: 'Welcome to Razi Hospital',
            adInterval: 30
          },
          active: true
        },
        {
          _id: 'reception-1',
          displayId: 'reception-1',
          name: 'Reception Display 1',
          type: 'counter',
          location: 'Reception Area',
          settings: {
            theme: 'professional',
            showAds: false,
            showLogo: true,
            customMessage: 'Reception - Please approach counter',
            adInterval: 0
          },
          active: true
        },
        {
          _id: 'department-opd',
          displayId: 'department-opd',
          name: 'OPD Department Display',
          type: 'department',
          location: 'OPD Wing',
          settings: {
            theme: 'medical',
            showAds: true,
            showLogo: true,
            customMessage: 'General OPD Department',
            adInterval: 45
          },
          active: true
        }
      ];
    }
  },

  /** 
   * Validate display settings
   */
  validateDisplaySettings(settings) {
    const defaults = {
      showLogo: true,
      showAds: true,
      theme: 'default',
      customMessage: '',
      adInterval: 30,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontSize: 'medium'
    };

    return {
      ...defaults,
      ...settings
    };
  },

  /** 
   * Get display by type
   */
  async getDisplaysByType(type) {
    try {
      const allDisplays = await this.getAllDisplays();
      return allDisplays.filter(display => display.type === type);
    } catch (error) {
      console.error('Error filtering displays by type:', error);
      return [];
    }
  }
};