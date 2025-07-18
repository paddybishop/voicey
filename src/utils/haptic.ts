// Haptic feedback utilities for mobile interactions

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

interface HapticConfig {
  pattern: number | number[];
  description: string;
}

const hapticPatterns: Record<HapticPattern, HapticConfig> = {
  light: {
    pattern: 50,
    description: 'Light tap feedback'
  },
  medium: {
    pattern: 100,
    description: 'Medium tap feedback'
  },
  heavy: {
    pattern: 200,
    description: 'Heavy tap feedback'
  },
  success: {
    pattern: [50, 50, 100],
    description: 'Success completion feedback'
  },
  error: {
    pattern: [100, 100, 100, 100, 100],
    description: 'Error feedback'
  },
  warning: {
    pattern: [200, 100, 200],
    description: 'Warning feedback'
  },
  selection: {
    pattern: [50, 25, 50],
    description: 'Selection feedback'
  }
};

export class HapticFeedback {
  private static isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  private static isEnabled(): boolean {
    // Check if user has disabled haptics in settings
    const setting = localStorage.getItem('haptic-feedback');
    return setting !== 'false';
  }

  static trigger(pattern: HapticPattern): void {
    if (!this.isSupported() || !this.isEnabled()) {
      return;
    }

    const hapticConfig = hapticPatterns[pattern];
    if (!hapticConfig) {
      console.warn(`Unknown haptic pattern: ${pattern}`);
      return;
    }

    try {
      navigator.vibrate(hapticConfig.pattern);
    } catch (error) {
      console.warn('Failed to trigger haptic feedback:', error);
    }
  }

  static enable(): void {
    localStorage.setItem('haptic-feedback', 'true');
  }

  static disable(): void {
    localStorage.setItem('haptic-feedback', 'false');
  }

  static isHapticEnabled(): boolean {
    return this.isEnabled();
  }

  static getAvailablePatterns(): HapticPattern[] {
    return Object.keys(hapticPatterns) as HapticPattern[];
  }

  static testPattern(pattern: HapticPattern): void {
    if (!this.isSupported()) {
      console.log('Haptic feedback not supported on this device');
      return;
    }
    
    console.log(`Testing haptic pattern: ${pattern} - ${hapticPatterns[pattern].description}`);
    this.trigger(pattern);
  }
}

// Voice-specific haptic feedback
export const VoiceHaptics = {
  startListening: () => HapticFeedback.trigger('medium'),
  stopListening: () => HapticFeedback.trigger('light'),
  voiceDetected: () => HapticFeedback.trigger('selection'),
  commandProcessed: () => HapticFeedback.trigger('success'),
  commandFailed: () => HapticFeedback.trigger('error'),
  todoCompleted: () => HapticFeedback.trigger('success'),
  todoDeleted: () => HapticFeedback.trigger('warning'),
  swipeGesture: () => HapticFeedback.trigger('light')
};

// Screen Wake Lock API for preventing screen sleep during voice recording
export class ScreenWakeLock {
  private static wakeLock: WakeLockSentinel | null = null;
  private static isSupported(): boolean {
    return 'wakeLock' in navigator;
  }

  static async request(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Screen Wake Lock API not supported');
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      
      this.wakeLock.addEventListener('release', () => {
        console.log('Screen wake lock released');
      });

      console.log('Screen wake lock acquired');
      return true;
    } catch (error) {
      console.error('Failed to acquire screen wake lock:', error);
      return false;
    }
  }

  static async release(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('Screen wake lock released manually');
    }
  }

  static isActive(): boolean {
    return this.wakeLock !== null && !this.wakeLock.released;
  }
}

// Mobile-specific utilities
export const MobileUtils = {
  isMobile: (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  isIOS: (): boolean => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  isAndroid: (): boolean => {
    return /Android/.test(navigator.userAgent);
  },

  getTouchSupport: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  getScreenOrientation: (): 'portrait' | 'landscape' => {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  },

  preventZoom: (): void => {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }
};