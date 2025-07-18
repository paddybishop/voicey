import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Smartphone, Accessibility } from 'lucide-react';
import { MobileUtils } from '../utils/haptic';

interface MobileAccessibilityProps {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  onAnnounce: (message: string) => void;
}

export const MobileAccessibility: React.FC<MobileAccessibilityProps> = ({
  isListening,
  isProcessing,
  transcript,
  error,
  onAnnounce
}) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    // Detect screen reader presence
    const checkScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader = !!(
        (navigator as any).userAgent.includes('JAWS') ||
        (navigator as any).userAgent.includes('NVDA') ||
        (navigator as any).userAgent.includes('VoiceOver') ||
        window.speechSynthesis?.speaking ||
        document.body.getAttribute('aria-hidden') === 'true'
      );
      
      setIsScreenReaderEnabled(hasScreenReader || MobileUtils.isMobile());
    };

    checkScreenReader();
    
    // Listen for screen reader events
    const handleFocus = () => checkScreenReader();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Announce voice states to screen readers
  useEffect(() => {
    if (!isScreenReaderEnabled) return;

    let message = '';
    if (isListening) {
      message = 'Voice recognition active. Speak your command.';
    } else if (isProcessing) {
      message = 'Processing your command. Please wait.';
    } else if (error) {
      message = `Error: ${error}`;
    } else if (transcript) {
      message = `Heard: ${transcript}`;
    }

    if (message) {
      announceToScreenReader(message);
    }
  }, [isListening, isProcessing, transcript, error, isScreenReaderEnabled]);

  const announceToScreenReader = (message: string) => {
    // Add to announcements list
    setAnnouncements(prev => [...prev.slice(-4), message]);
    
    // Use onAnnounce callback
    onAnnounce(message);

    // Direct ARIA live region update
    const liveRegion = document.getElementById('voice-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  };

  const getVoiceStatusIcon = () => {
    if (isListening) return <Volume2 className="w-5 h-5 text-blue-400" />;
    if (isProcessing) return <Smartphone className="w-5 h-5 text-yellow-400 animate-pulse" />;
    if (error) return <VolumeX className="w-5 h-5 text-red-400" />;
    return <Accessibility className="w-5 h-5 text-green-400" />;
  };

  const getVoiceStatusText = () => {
    if (isListening) return 'Listening for voice command';
    if (isProcessing) return 'Processing voice command';
    if (error) return `Voice error: ${error}`;
    return 'Voice ready';
  };

  if (!isScreenReaderEnabled && !MobileUtils.isMobile()) {
    return null;
  }

  return (
    <>
      {/* ARIA Live Region for screen reader announcements */}
      <div
        id="voice-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Visual accessibility indicator for mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-4 right-4 z-50 bg-black/20 backdrop-blur-sm rounded-lg p-2 border border-white/20"
      >
        <div className="flex items-center space-x-2">
          {getVoiceStatusIcon()}
          <span className="text-white text-xs font-medium">
            {getVoiceStatusText()}
          </span>
        </div>
      </motion.div>

      {/* Mobile accessibility controls */}
      {MobileUtils.isMobile() && (
        <div className="fixed bottom-4 left-4 z-50">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/20"
          >
            <div className="text-white text-xs space-y-1">
              <div className="font-medium">Voice Status:</div>
              <div className="opacity-75">{getVoiceStatusText()}</div>
              {transcript && (
                <div className="text-blue-300 italic">
                  "{transcript}"
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Accessibility announcements history */}
      {announcements.length > 0 && (
        <div className="fixed bottom-20 left-4 z-40 max-w-xs">
          <div className="space-y-2">
            {announcements.slice(-3).map((announcement, index) => (
              <motion.div
                key={`${announcement}-${index}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-black/40 backdrop-blur-sm rounded-lg p-2 border border-white/20 text-white text-xs"
              >
                {announcement}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// Screen reader utilities
export const ScreenReaderUtils = {
  announce: (message: string) => {
    const liveRegion = document.getElementById('voice-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  },

  setFocus: (element: HTMLElement) => {
    if (element && element.focus) {
      element.focus();
    }
  },

  describeTodoItem: (todo: { text: string; completed: boolean; priority: string }) => {
    const status = todo.completed ? 'completed' : 'active';
    const priority = todo.priority !== 'low' ? `, ${todo.priority} priority` : '';
    return `${todo.text}, ${status}${priority}`;
  },

  describeVoiceAction: (action: string, result: string) => {
    return `Voice command ${action} executed. ${result}`;
  }
};