import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { VoiceWaveform } from './VoiceWaveform';
import { useVoiceActivity } from '../hooks/useVoiceActivity';
import { VoiceHaptics, ScreenWakeLock } from '../utils/haptic';

interface VoiceButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  transcript: string;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  isProcessing,
  isSupported,
  onStartListening,
  onStopListening,
  transcript
}) => {
  const voiceActivity = useVoiceActivity(isListening);
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Handle screen wake lock
  useEffect(() => {
    if (isListening) {
      ScreenWakeLock.request();
    } else {
      ScreenWakeLock.release();
    }
  }, [isListening]);

  // Enhanced haptic feedback based on voice activity
  useEffect(() => {
    if (voiceActivity.isVoiceDetected) {
      VoiceHaptics.voiceDetected();
    }
  }, [voiceActivity.isVoiceDetected]);
  
  const handleClick = () => {
    if (isListening) {
      VoiceHaptics.stopListening();
      onStopListening();
    } else {
      VoiceHaptics.startListening();
      onStartListening();
    }
  };

  const handleTouchStart = () => {
    setIsPressed(true);
    VoiceHaptics.startListening();
    
    // Start long press timer for continuous mode
    const timer = setTimeout(() => {
      if (!isListening) {
        onStartListening();
      }
    }, 200);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
          <MicOff className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-500 text-center">
          Speech recognition not supported in this browser
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* Voice waveform visualization */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-48 h-12">
          <VoiceWaveform 
            isListening={isListening} 
            audioLevel={voiceActivity.audioLevel}
            className="w-full h-full"
          />
        </div>
        
        {/* Breathing effect background */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: isListening ? [1, 1.2, 1] : [1, 1.05, 1],
            opacity: isListening ? [0.3, 0.6, 0.3] : [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: isListening ? 2 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: isListening 
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.1) 70%, transparent 100%)'
              : 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, rgba(14, 165, 233, 0.1) 70%, transparent 100%)'
          }}
        />
        
        {/* Main button */}
        <motion.button
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={isProcessing}
          className={`
            relative w-20 h-20 rounded-full shadow-lg transition-all duration-300 touch-manipulation overflow-hidden
            ${isListening 
              ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50' 
              : 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary-500/50'
            }
            ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            ${isPressed ? 'scale-95' : ''}
            disabled:opacity-50
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: isListening ? [1, 1.05, 1] : isPressed ? 0.95 : 1,
            boxShadow: isListening 
              ? ['0 0 20px rgba(239, 68, 68, 0.5)', '0 0 40px rgba(239, 68, 68, 0.8)', '0 0 20px rgba(239, 68, 68, 0.5)']
              : '0 0 20px rgba(14, 165, 233, 0.3)'
          }}
          transition={{ 
            repeat: isListening ? Infinity : 0,
            duration: 1.5,
            ease: "easeInOut"
          }}
        >
          {/* Voice activity indicator */}
          {isListening && voiceActivity.isVoiceDetected && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          
          {/* Button icon */}
          <div className="relative z-10">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : isListening ? (
              <motion.div
                animate={{ 
                  scale: voiceActivity.isVoiceDetected ? [1, 1.2, 1] : 1,
                  rotate: voiceActivity.isVoiceDetected ? [0, 5, -5, 0] : 0
                }}
                transition={{ 
                  duration: 0.6,
                  repeat: voiceActivity.isVoiceDetected ? Infinity : 0
                }}
              >
                <Mic className="w-8 h-8 text-white drop-shadow-lg" />
              </motion.div>
            ) : (
              <Mic className="w-8 h-8 text-white drop-shadow-lg" />
            )}
          </div>
        </motion.button>
        
        {/* Multiple ripple effects */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-300/60"
              animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-400/40"
              animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 0.5 }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-red-500/30"
              animate={{ scale: [1, 2.8], opacity: [0.3, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeOut", delay: 1 }}
            />
          </>
        )}
      </div>
      
      <div className="text-center min-h-[60px]">
        <div className="flex items-center justify-center space-x-2">
          <p className="text-white font-medium">
            {isProcessing 
              ? 'Processing...' 
              : isListening 
                ? (voiceActivity.isVoiceDetected ? 'Voice detected' : 'Listening...') 
                : 'Tap to speak'
            }
          </p>
          
          {/* Voice activity indicator */}
          {isListening && (
            <motion.div
              className={`w-3 h-3 rounded-full ${
                voiceActivity.isVoiceDetected 
                  ? 'bg-green-400' 
                  : 'bg-yellow-400'
              }`}
              animate={{
                scale: voiceActivity.isVoiceDetected ? [1, 1.3, 1] : 1,
                opacity: voiceActivity.isVoiceDetected ? [0.7, 1, 0.7] : 0.5
              }}
              transition={{
                duration: 0.5,
                repeat: voiceActivity.isVoiceDetected ? Infinity : 0
              }}
            />
          )}
        </div>
        
        {/* Confidence level bar */}
        {isListening && voiceActivity.confidence > 0.1 && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            className="mt-2 mx-auto max-w-xs"
          >
            <div className="w-full bg-white/20 rounded-full h-1">
              <motion.div
                className="bg-gradient-to-r from-green-400 to-blue-400 h-1 rounded-full"
                animate={{ width: `${voiceActivity.confidence * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-white/60 text-xs mt-1">
              Confidence: {Math.round(voiceActivity.confidence * 100)}%
            </p>
          </motion.div>
        )}
        
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 max-w-xs"
          >
            <p className="text-white/90 text-sm text-center">
              "{transcript}"
            </p>
            {isListening && (
              <div className="mt-2 flex justify-center">
                <div className="flex space-x-1">
                  <motion.div 
                    className="w-2 h-2 bg-white/60 rounded-full"
                    animate={{ 
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: 0 
                    }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-white/60 rounded-full"
                    animate={{ 
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: 0.2 
                    }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-white/60 rounded-full"
                    animate={{ 
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: 0.4 
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
      
      <div className="text-center text-white/70 text-xs max-w-xs">
        <p>Try saying: "Add buy groceries", "Complete task 1", "Delete shopping"</p>
      </div>
    </div>
  );
};