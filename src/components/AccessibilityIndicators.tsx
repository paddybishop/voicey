import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Volume2, VolumeX, Subtitles, Settings } from 'lucide-react';

interface AccessibilityIndicatorsProps {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleVisualMode: () => void;
}

export const AccessibilityIndicators: React.FC<AccessibilityIndicatorsProps> = ({
  isListening,
  isProcessing,
  transcript,
  error,
  soundEnabled,
  onToggleSound,
  onToggleVisualMode
}) => {
  const [visualMode, setVisualMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);

  useEffect(() => {
    // Check if user prefers reduced motion or has accessibility needs
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion || hasHighContrast) {
      setVisualMode(true);
    }
  }, []);

  useEffect(() => {
    if (transcript && transcript.trim()) {
      setTranscriptHistory(prev => {
        const newHistory = [...prev, transcript];
        // Keep only last 3 transcripts
        return newHistory.slice(-3);
      });
    }
  }, [transcript]);

  const handleToggleVisualMode = () => {
    setVisualMode(!visualMode);
    onToggleVisualMode();
  };

  const getStatusColor = () => {
    if (error) return 'text-red-400';
    if (isProcessing) return 'text-yellow-400';
    if (isListening) return 'text-green-400';
    return 'text-blue-400';
  };

  const getStatusIcon = () => {
    if (error) return '⚠️';
    if (isProcessing) return '⏳';
    if (isListening) return '🎤';
    return '💬';
  };

  const getStatusText = () => {
    if (error) return 'Error occurred';
    if (isProcessing) return 'Processing your command...';
    if (isListening) return 'Listening for your voice...';
    return 'Tap microphone to speak';
  };

  return (
    <>
      {/* Accessibility Settings Toggle */}
      <motion.button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-4 right-4 z-30 p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Accessibility settings"
      >
        <Settings className="w-5 h-5 text-white" />
      </motion.button>

      {/* Accessibility Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-16 right-4 z-30 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 min-w-[200px]"
          >
            <h3 className="text-white font-medium mb-3">Accessibility</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleToggleVisualMode}
                className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {visualMode ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                <span className="text-white text-sm">Visual Mode</span>
              </button>
              
              <button
                onClick={onToggleSound}
                className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                <span className="text-white text-sm">Voice Feedback</span>
              </button>
              
              <div className="border-t border-white/20 pt-2">
                <p className="text-white/60 text-xs">
                  Visual mode provides enhanced visual feedback for hearing-impaired users
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Status Indicator */}
      {visualMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
        >
          <div className="flex items-center space-x-2">
            <motion.span
              className="text-lg"
              animate={{
                scale: isListening ? [1, 1.2, 1] : 1,
                rotate: isProcessing ? [0, 360] : 0
              }}
              transition={{
                duration: isListening ? 1 : 2,
                repeat: isListening || isProcessing ? Infinity : 0
              }}
            >
              {getStatusIcon()}
            </motion.span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </motion.div>
      )}

      {/* Enhanced Transcript Display */}
      {visualMode && (
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 max-w-sm"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Subtitles className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">Live Transcript</span>
              </div>
              
              <div className="space-y-2">
                {transcriptHistory.map((text, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-2 rounded-lg ${
                      index === transcriptHistory.length - 1 
                        ? 'bg-blue-500/20 border border-blue-500/30' 
                        : 'bg-white/5'
                    }`}
                  >
                    <p className="text-white text-sm">"{text}"</p>
                    {index === transcriptHistory.length - 1 && isListening && (
                      <div className="flex justify-end mt-1">
                        <motion.div
                          className="w-2 h-2 bg-green-400 rounded-full"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Error Display Enhancement */}
      {visualMode && error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30 max-w-sm"
        >
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-red-200 font-medium text-sm">Voice Recognition Error</p>
              <p className="text-red-100 text-xs mt-1">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Processing Indicator */}
      {visualMode && isProcessing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full"
            />
            <span className="text-yellow-200 text-sm font-medium">Processing your command...</span>
          </div>
        </motion.div>
      )}
    </>
  );
};