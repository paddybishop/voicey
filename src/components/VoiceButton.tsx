import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';

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
  const handleClick = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
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
      <motion.button
        onClick={handleClick}
        disabled={isProcessing}
        className={`
          relative w-20 h-20 rounded-full shadow-lg transition-all duration-300 touch-manipulation
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50 shadow-lg' 
            : 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/50'
          }
          ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          disabled:opacity-50
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isListening ? { scale: [1, 1.1, 1] } : {}}
        transition={{ 
          repeat: isListening ? Infinity : 0,
          duration: 1.5,
          ease: "easeInOut"
        }}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isListening ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            <Mic className="w-8 h-8 text-white" />
          </motion.div>
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
        
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-300"
            animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </motion.button>
      
      <div className="text-center min-h-[60px]">
        <p className="text-white font-medium">
          {isProcessing 
            ? 'Processing...' 
            : isListening 
              ? 'Listening...' 
              : 'Tap to speak'
          }
        </p>
        
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
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
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