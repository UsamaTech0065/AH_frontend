import React from 'react';

// ✅ ENHANCED: UNIVERSAL VOICE SERVICE - CENTRALIZED MULTI-PC SYSTEM
class UniversalVoiceService {
  constructor() {
    this.speechEngine = null;
    this.voiceReady = false;
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.socket = null;
    this.fallbackMode = false;
    this.audioContext = null;
    this.audioElements = new Map();
    this.currentAudio = null;
    this.audioCache = new Map();
    this.isMP3Supported = true;
    this.voiceQueue = [];
    this.isProcessingQueue = false;
    this.centralizedMode = true; // ✅ MULTI-PC SUPPORT
    
    // ✅ CENTRALIZED SYSTEM SETTINGS
    this.settings = {
      autoPlay: true,
      soundNotifications: true,
      voiceVolume: 1.0,
      voiceRate: 0.85,
      voicePitch: 1.2,
      language: 'urdu',
      centralizedSystem: true
    };
    
    this.init();
  }

  setSocket(socket) {
    this.socket = socket;
    console.log('🔊 CENTRALIZED: Socket set for voice service');
  }

  init() {
    // Check browser support
    if (!('speechSynthesis' in window)) {
      console.warn('❌ Speech synthesis not supported, using MP3 mode only');
      this.fallbackMode = true;
    }

    // Check MP3 support
    const audio = new Audio();
    this.isMP3Supported = !!audio.canPlayType && (
      audio.canPlayType('audio/mp3') !== '' ||
      audio.canPlayType('audio/mpeg') !== ''
    );

    console.log(`🔊 CENTRALIZED MP3 Support: ${this.isMP3Supported ? '✅' : '❌'}`);
    console.log(`🔊 CENTRALIZED System: ${this.centralizedMode ? 'ACTIVE' : 'INACTIVE'}`);

    this.speechEngine = window.speechSynthesis;
    this.loadVoices();
    
    // Additional fallback initialization
    this.initFallbackMode();

    // ✅ AUTO-RECONNECT FOR CENTRALIZED SYSTEM
    this.setupAutoReconnect();
  }

  setupAutoReconnect() {
    // Auto-reload voices every 30 seconds
    setInterval(() => {
      this.loadVoices();
    }, 30000);

    // Clean up audio cache every hour
    setInterval(() => {
      this.cleanupAudioCache();
    }, 3600000);
  }

  initFallbackMode() {
    // Create audio context for fallback sounds
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('✅ Audio context created for fallback sounds');
    } catch (error) {
      console.warn('❌ Audio context not supported:', error);
    }
  }

  loadVoices() {
    if (!this.speechEngine) return;

    const loadAvailableVoices = () => {
      const voices = this.speechEngine.getVoices();
      console.log(`🔊 Available voices: ${voices.length}`);
      
      // Try to find Urdu voice first
      const urduVoice = this.findBestUrduVoice(voices);
      
      if (urduVoice) {
        this.selectedVoice = urduVoice;
        this.voiceReady = true;
        console.log('✅ CENTRALIZED Urdu voice loaded:', urduVoice.name);
      } else if (voices.length > 0) {
        // Fallback to any available voice
        this.selectedVoice = voices[0];
        this.voiceReady = true;
        console.log('✅ CENTRALIZED default voice loaded:', voices[0].name);
      } else {
        console.warn('❌ No voices available, using MP3/fallback mode');
        this.fallbackMode = true;
      }
    };

    if (this.speechEngine.getVoices().length > 0) {
      loadAvailableVoices();
    } else {
      this.speechEngine.addEventListener('voiceschanged', loadAvailableVoices);
    }
  }

  findBestUrduVoice(voices) {
    if (!voices || voices.length === 0) return null;

    const scoredVoices = voices.map(voice => {
      let score = 0;
      const voiceLang = voice.lang.toLowerCase();
      const voiceName = voice.name.toLowerCase();

      if (voiceLang.includes('ur-pk')) score += 1000;
      if (voiceLang.includes('ur_in')) score += 800;
      if (voiceLang.includes('ur')) score += 600;
      if (voiceName.includes('female')) score += 500;
      if (voiceName.includes('pakistan')) score += 600;
      if (voiceName.includes('urdu')) score += 400;
      if (voice.localService) score += 200;
      if (voice.default) score += 300;

      return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);
    return scoredVoices.length > 0 && scoredVoices[0].score > 0 ? scoredVoices[0].voice : null;
  }

  // ✅ ENHANCED: CENTRALIZED VOICE QUEUE MANAGEMENT
  async addToVoiceQueue(announcementData) {
    if (!this.settings.soundNotifications) {
      console.log('🔇 Sound notifications disabled, skipping announcement');
      return;
    }

    // Add to queue
    this.voiceQueue.push({
      ...announcementData,
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      status: 'queued'
    });

    console.log(`📝 CENTRALIZED: Added to voice queue: ${announcementData.ticketNumber} (Queue: ${this.voiceQueue.length})`);

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      await this.processVoiceQueue();
    }
  }

  async processVoiceQueue() {
    if (this.isProcessingQueue || this.voiceQueue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      while (this.voiceQueue.length > 0) {
        const announcement = this.voiceQueue[0];
        
        try {
          console.log(`🔊 CENTRALIZED: Processing voice announcement: ${announcement.ticketNumber}`);
          
          // Update status
          announcement.status = 'processing';

          // Process based on type
          let result;
          if (announcement.type === 'mp3_announcement' && announcement.audioUrl) {
            result = await this.playMP3Announcement(announcement);
          } else {
            result = await this.playTTSAnnouncement(announcement);
          }

          if (result.success) {
            console.log(`✅ CENTRALIZED: Voice announcement completed: ${announcement.ticketNumber}`);
            
            // ✅ NOTIFY CENTRALIZED SYSTEM OF COMPLETION
            if (this.socket) {
              this.socket.emit('voice-announcement-completed', {
                requestId: announcement.requestId,
                ticketNumber: announcement.ticketNumber,
                counterNumber: announcement.counterNumber,
                isRecall: announcement.isRecall,
                completedAt: new Date(),
                method: result.method
              });
            }
          } else {
            console.error(`❌ CENTRALIZED: Voice announcement failed: ${announcement.ticketNumber}`);
          }

        } catch (error) {
          console.error(`❌ Error processing voice announcement ${announcement.ticketNumber}:`, error);
        }

        // Remove processed announcement
        this.voiceQueue.shift();

        // Small delay between announcements
        if (this.voiceQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('❌ Error in voice queue processing:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // ✅ ENHANCED: PLAY CENTRALIZED MP3 ANNOUNCEMENT
  async playMP3Announcement(announcementData) {
    const { audioUrl, ticketNumber, counterNumber, isRecall } = announcementData;
    
    console.log(`🔊 CENTRALIZED MP3: Playing ${audioUrl}`);
    
    return new Promise((resolve) => {
      try {
        this.playAudioFile(audioUrl)
          .then(() => {
            console.log(`✅ CENTRALIZED MP3 completed: ${ticketNumber}`);
            resolve({ success: true, method: 'mp3' });
          })
          .catch((error) => {
            console.error(`❌ CENTRALIZED MP3 failed: ${ticketNumber}`, error);
            // Fallback to TTS
            this.playTTSAnnouncement(announcementData)
              .then(fallbackResult => resolve(fallbackResult))
              .catch(() => resolve({ success: false, method: 'mp3_fallback_failed' }));
          });

      } catch (error) {
        console.error(`❌ CENTRALIZED MP3 setup failed: ${ticketNumber}`, error);
        this.playTTSAnnouncement(announcementData)
          .then(fallbackResult => resolve(fallbackResult))
          .catch(() => resolve({ success: false, method: 'mp3_setup_failed' }));
      }
    });
  }

  // ✅ ENHANCED: PLAY AUDIO FILE WITH BETTER ERROR HANDLING
  playAudioFile(audioUrl) {
    return new Promise((resolve, reject) => {
      // Stop any currently playing audio
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      
      // Check cache first
      if (this.audioCache.has(audioUrl)) {
        console.log('🔊 Using cached centralized audio');
        const audio = this.audioCache.get(audioUrl).cloneNode();
        this.setupAudioElement(audio, resolve, reject);
        return;
      }
      
      const audio = new Audio(audioUrl);
      this.audioCache.set(audioUrl, audio.cloneNode());
      
      this.setupAudioElement(audio, resolve, reject);
    });
  }

  setupAudioElement(audio, resolve, reject) {
    this.currentAudio = audio;
    
    audio.volume = this.settings.voiceVolume;
    audio.preload = 'auto';
    
    audio.onended = () => {
      this.currentAudio = null;
      resolve();
    };
    
    audio.onerror = (error) => {
      this.currentAudio = null;
      console.error('❌ CENTRALIZED audio playback error:', error);
      reject(error);
    };

    audio.oncanplaythrough = () => {
      console.log('🔊 CENTRALIZED audio loaded and ready to play');
    };

    audio.onloadstart = () => {
      console.log('🔊 CENTRALIZED audio loading started');
    };

    // Start playback with error handling
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('🔊 CENTRALIZED audio playback started successfully');
        })
        .catch(error => {
          console.error('❌ CENTRALIZED audio play failed:', error);
          
          // Try with user interaction
          const tryWithInteraction = () => {
            audio.play()
              .then(() => {
                console.log('🔊 CENTRALIZED audio started after user interaction');
                document.removeEventListener('click', tryWithInteraction);
              })
              .catch(e => {
                console.error('❌ CENTRALIZED audio failed even with interaction:', e);
                reject(e);
              });
          };
          
          document.addEventListener('click', tryWithInteraction);
          reject(error);
        });
    }
  }

  // ✅ UPDATED: CENTRALIZED TTS ANNOUNCEMENT (FALLBACK)
  async playTTSAnnouncement(announcementData) {
    const { ticketNumber, counterNumber, isRecall, message } = announcementData;
    
    console.log(`🔊 CENTRALIZED TTS: ${ticketNumber} for Counter ${counterNumber}`);
    
    return new Promise((resolve) => {
      if (this.fallbackMode || !this.isMP3Supported) {
        console.log('🔊 Using centralized fallback mode for announcement');
        this.playFallbackSound().then(() => {
          resolve({ success: true, method: 'fallback_sound' });
        });
        return;
      }

      if (!this.speechEngine || this.isSpeaking || !this.voiceReady) {
        console.warn('❌ CENTRALIZED voice system not ready, using fallback');
        this.playFallbackSound().then(() => {
          resolve({ success: true, method: 'fallback_system_not_ready' });
        });
        return;
      }

      try {
        this.isSpeaking = true;
        
        const utterance = new SpeechSynthesisUtterance(
          message || this.getUrduAnnouncementMessage(ticketNumber, counterNumber, isRecall)
        );
        
        utterance.voice = this.selectedVoice;
        utterance.lang = 'ur-PK';
        utterance.rate = this.settings.voiceRate;
        utterance.pitch = this.settings.voicePitch;
        utterance.volume = this.settings.voiceVolume;

        utterance.onend = () => {
          this.isSpeaking = false;
          console.log('✅ CENTRALIZED TTS announcement completed');
          setTimeout(() => {
            resolve({ success: true, method: 'tts' });
          }, 500);
        };

        utterance.onerror = (event) => {
          this.isSpeaking = false;
          console.error('❌ CENTRALIZED TTS announcement error:', event);
          // Fallback to sound
          this.playFallbackSound().then(() => {
            resolve({ success: true, method: 'tts_fallback' });
          });
        };

        // Cancel any ongoing speech
        if (this.speechEngine.speaking) {
          this.speechEngine.cancel();
          setTimeout(() => {
            this.speechEngine.speak(utterance);
          }, 300);
        } else {
          this.speechEngine.speak(utterance);
        }

      } catch (error) {
        this.isSpeaking = false;
        console.error('❌ Error in CENTRALIZED TTS announcement:', error);
        this.playFallbackSound().then(() => {
          resolve({ success: true, method: 'tts_error_fallback' });
        });
      }
    });
  }

  convertToUrduPronunciation(text) {
    if (!text) return text;
    
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      switch (char.toUpperCase()) {
        case 'A': result += 'ای '; break;
        case 'B': result += 'بی '; break;
        case 'C': result += 'سی '; break;
        case 'D': result += 'ڈی '; break;
        case 'E': result += 'ای '; break;
        case 'F': result += 'ایف '; break;
        case 'G': result += 'جی '; break;
        case 'H': result += 'ایچ '; break;
        case 'I': result += 'آئی '; break;
        case 'J': result += 'جے '; break;
        case 'K': result += 'کے '; break;
        case 'L': result += 'ایل '; break;
        case 'M': result += 'ایم '; break;
        case 'N': result += 'این '; break;
        case 'O': result += 'او '; break;
        case 'P': result += 'پی '; break;
        case 'Q': result += 'کیو '; break;
        case 'R': result += 'آر '; break;
        case 'S': result += 'ایس '; break;
        case 'T': result += 'ٹی '; break;
        case 'U': result += 'یو '; break;
        case 'V': result += 'وی '; break;
        case 'W': result += 'ڈبلیو '; break;
        case 'X': result += 'ایکس '; break;
        case 'Y': result += 'وائے '; break;
        case 'Z': result += 'زیڈ '; break;
        case '0': result += 'زیرو '; break;
        case '1': result += 'ایک '; break;
        case '2': result += 'دو '; break;
        case '3': result += 'تین '; break;
        case '4': result += 'چار '; break;
        case '5': result += 'پانچ '; break;
        case '6': result += 'چھ '; break;
        case '7': result += 'سات '; break;
        case '8': result += 'آٹھ '; break;
        case '9': result += 'نو '; break;
        case '-': result += '  '; break;
        case ' ': result += '  '; break;
        default: result += char + ' '; break;
      }
    }
    
    return result.trim();
  }

  getUrduAnnouncementMessage(ticketNumber, counterNumber, isRecall = false) {
    const urduTicketNumber = this.convertToUrduPronunciation(ticketNumber);
    const urduCounterNumber = this.convertToUrduPronunciation(counterNumber.toString());

    if (isRecall) {
      return `ٹکٹ نمبر ${urduTicketNumber} برائے کرم فوری طور پر کاؤنٹر نمبر ${urduCounterNumber} پر تشریف لائیں۔ شکریہ۔`;
    } else {
      return `ٹکٹ نمبر ${urduTicketNumber} برائے کرم کاؤنٹر نمبر ${urduCounterNumber} پر تشریف لائیں۔ شکریہ۔`;
    }
  }

  // ✅ FIXED: CENTRALIZED FALLBACK SOUND SYSTEM
  playFallbackSound() {
    return new Promise((resolve) => {
      try {
        // Create beep sound using Web Audio API
        if (this.audioContext) {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
          gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
          
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.5);
          
          setTimeout(() => {
            resolve();
          }, 800);
        } else {
          // Fallback to timeout if audio context fails
          setTimeout(() => {
            resolve();
          }, 1000);
        }
      } catch (error) {
        console.error('❌ CENTRALIZED fallback sound error:', error);
        setTimeout(() => {
          resolve();
        }, 1000);
      }
    });
  }

  // ✅ ENHANCED CENTRALIZED VOICE STATUS WITH QUEUE INFO
  getVoiceStatus() {
    return {
      voiceReady: this.voiceReady,
      isSpeaking: this.isSpeaking,
      isProcessingQueue: this.isProcessingQueue,
      fallbackMode: this.fallbackMode,
      mp3Supported: this.isMP3Supported,
      currentAudio: !!this.currentAudio,
      audioCacheSize: this.audioCache.size,
      voiceQueueLength: this.voiceQueue.length,
      voicesAvailable: this.speechEngine ? this.speechEngine.getVoices().length : 0,
      selectedVoice: this.selectedVoice ? this.selectedVoice.name : 'None',
      settings: this.settings,
      system: 'centralized_universal_mp3_tts_fallback',
      features: [
        'multi_pc_support',
        'voice_queue_management',
        'mp3_playback',
        'tts_fallback',
        'audio_caching',
        'auto_reconnect',
        'centralized_broadcast'
      ]
    };
  }

  // Test centralized voice system
  async testVoiceSystem() {
    console.log('🔊 Testing CENTRALIZED voice system...');
    const status = this.getVoiceStatus();
    console.log('CENTRALIZED Voice Status:', status);
    
    const testAnnouncement = {
      type: 'test_announcement',
      ticketNumber: 'TEST001',
      counterNumber: 1,
      isRecall: false,
      message: 'مرکزی نظام کامیاب ہے۔ آواز کا نظام کام کر رہا ہے۔',
      requestId: 'test-' + Date.now(),
      timestamp: new Date()
    };
    
    return this.addToVoiceQueue(testAnnouncement);
  }

  // Clear centralized audio cache
  cleanupAudioCache() {
    const previousSize = this.audioCache.size;
    this.audioCache.clear();
    console.log(`🧹 Cleared CENTRALIZED audio cache (${previousSize} entries)`);
    return previousSize;
  }

  // Clear voice queue
  clearVoiceQueue() {
    const previousSize = this.voiceQueue.length;
    this.voiceQueue = [];
    console.log(`🧹 Cleared CENTRALIZED voice queue (${previousSize} entries)`);
    return previousSize;
  }

  // Preload centralized audio files
  async preloadAudio(audioUrls) {
    const loadPromises = audioUrls.map(url => {
      return new Promise((resolve) => {
        if (this.audioCache.has(url)) {
          resolve(true);
          return;
        }

        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        
        audio.oncanplaythrough = () => {
          this.audioCache.set(url, audio);
          resolve(true);
        };
        
        audio.onerror = () => {
          console.warn(`❌ Failed to preload CENTRALIZED audio: ${url}`);
          resolve(false);
        };
      });
    });

    const results = await Promise.all(loadPromises);
    const successful = results.filter(Boolean).length;
    console.log(`✅ Preloaded ${successful}/${audioUrls.length} CENTRALIZED audio files`);
    
    return { successful, total: audioUrls.length };
  }

  // Update settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    console.log('⚙️ CENTRALIZED voice settings updated:', this.settings);
  }

  // ✅ CENTRALIZED: Process announcement from server (MAIN METHOD)
  async processCentralizedAnnouncement(announcementData) {
    console.log('🔊 CENTRALIZED: Processing announcement from server:', announcementData);
    
    if (!this.settings.autoPlay) {
      console.log('🔇 CENTRALIZED: Auto-play disabled, skipping announcement');
      return { success: false, reason: 'auto_play_disabled' };
    }

    try {
      await this.addToVoiceQueue(announcementData);
      return { success: true, queued: true, queuePosition: this.voiceQueue.length };
    } catch (error) {
      console.error('❌ CENTRALIZED: Failed to process announcement:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ CENTRALIZED: Direct announce ticket
  async announceTicket(ticketNumber, counterNumber, isRecall = false) {
    const announcementData = {
      type: 'direct_announcement',
      ticketNumber,
      counterNumber,
      isRecall,
      message: this.getUrduAnnouncementMessage(ticketNumber, counterNumber, isRecall),
      timestamp: new Date(),
      requestId: 'direct-' + Date.now()
    };
    
    return this.processCentralizedAnnouncement(announcementData);
  }

  // ✅ CENTRALIZED: Stop all audio
  stopAllAudio() {
    // Stop current audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    // Stop speech synthesis
    if (this.speechEngine) {
      this.speechEngine.cancel();
    }
    
    // Clear queue
    this.clearVoiceQueue();
    
    this.isSpeaking = false;
    console.log('🛑 CENTRALIZED: All audio stopped');
  }

  // ✅ CENTRALIZED: Get queue information
  getQueueInfo() {
    return {
      queueLength: this.voiceQueue.length,
      isProcessing: this.isProcessingQueue,
      currentPlaying: !!this.currentAudio || this.isSpeaking,
      queue: this.voiceQueue.map(item => ({
        ticketNumber: item.ticketNumber,
        counterNumber: item.counterNumber,
        isRecall: item.isRecall,
        status: item.status,
        timestamp: item.timestamp
      }))
    };
  }

  // ✅ CENTRALIZED: Emergency stop
  emergencyStop() {
    this.stopAllAudio();
    this.isProcessingQueue = false;
    console.log('🛑 CENTRALIZED: Emergency stop executed');
  }

  // ✅ CENTRALIZED: Resume service
  resumeService() {
    if (this.voiceQueue.length > 0 && !this.isProcessingQueue) {
      this.processVoiceQueue();
    }
    console.log('🟢 CENTRALIZED: Service resumed');
  }
}

// Create global centralized instance
const universalVoiceService = new UniversalVoiceService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.centralizedVoiceService = universalVoiceService;
}

// React Hook for using the voice service
export const useVoiceService = () => {
  const [voiceStatus, setVoiceStatus] = React.useState(universalVoiceService.getVoiceStatus());
  const [queueInfo, setQueueInfo] = React.useState(universalVoiceService.getQueueInfo());

  React.useEffect(() => {
    // Update status every second
    const interval = setInterval(() => {
      setVoiceStatus(universalVoiceService.getVoiceStatus());
      setQueueInfo(universalVoiceService.getQueueInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    voiceService: universalVoiceService,
    voiceStatus,
    queueInfo,
    
    // Convenience methods
    announceTicket: (ticketNumber, counterNumber, isRecall) => 
      universalVoiceService.announceTicket(ticketNumber, counterNumber, isRecall),
    
    processAnnouncement: (announcementData) =>
      universalVoiceService.processCentralizedAnnouncement(announcementData),
    
    stopAll: () => universalVoiceService.stopAllAudio(),
    
    testSystem: () => universalVoiceService.testVoiceSystem(),
    
    updateSettings: (newSettings) => universalVoiceService.updateSettings(newSettings),
    
    getStatus: () => universalVoiceService.getVoiceStatus(),
    
    getQueue: () => universalVoiceService.getQueueInfo(),
    
    clearQueue: () => universalVoiceService.clearVoiceQueue(),
    
    emergencyStop: () => universalVoiceService.emergencyStop(),
    
    resumeService: () => universalVoiceService.resumeService()
  };
};

export default universalVoiceService;