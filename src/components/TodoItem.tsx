import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { Todo } from '../types';
import { format } from 'date-fns';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { VoiceHaptics } from '../utils/haptic';

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  index,
  onToggle,
  onDelete
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showActions, setShowActions] = useState(false);

  const handleSwipeRight = () => {
    if (!todo.completed) {
      VoiceHaptics.todoCompleted();
      onToggle(todo.id);
    }
  };

  const handleSwipeLeft = () => {
    VoiceHaptics.todoDeleted();
    onDelete(todo.id);
  };

  const {
    isSwipeActive,
    swipeDirection,
    swipeDistance,
    bindGesture
  } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 80,
    velocityThreshold: 0.2
  });

  // Calculate swipe visual feedback
  const getSwipeOffset = () => {
    if (!isSwipeActive) return 0;
    
    const maxOffset = 100;
    const offset = Math.min(swipeDistance, maxOffset);
    return swipeDirection === 'left' ? -offset : offset;
  };

  const getBackgroundColor = () => {
    if (!isSwipeActive) return '';
    
    if (swipeDirection === 'right' && !todo.completed) {
      return 'bg-green-500/20 border-green-500/30';
    } else if (swipeDirection === 'left') {
      return 'bg-red-500/20 border-red-500/30';
    }
    return '';
  };

  const handleTouchStart = (e: TouchEvent) => {
    setShowActions(true);
    bindGesture.onTouchStart(e);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    setShowActions(false);
    bindGesture.onTouchEnd(e);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe action backgrounds */}
      {isSwipeActive && (
        <div className="absolute inset-0 flex items-center justify-between px-6">
          {swipeDirection === 'right' && !todo.completed && (
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-6 h-6" />
              <span className="font-medium">Complete</span>
            </div>
          )}
          {swipeDirection === 'left' && (
            <div className="flex items-center space-x-2 text-red-400 ml-auto">
              <span className="font-medium">Delete</span>
              <Trash2 className="w-6 h-6" />
            </div>
          )}
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          x: getSwipeOffset()
        }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={`
          relative p-4 rounded-xl border transition-all duration-200
          ${todo.completed 
            ? 'bg-white/10 border-white/20 opacity-75 backdrop-blur-sm' 
            : 'bg-white/20 border-white/30 hover:border-white/40 hover:bg-white/25 backdrop-blur-sm'
          }
          ${getBackgroundColor()}
        `}
        {...bindGesture}
      >
      <div className="flex items-start space-x-3">
        <motion.button
          onClick={() => {
            VoiceHaptics.todoCompleted();
            onToggle(todo.id);
          }}
          className={`
            flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center
            transition-all duration-200 touch-manipulation
            ${todo.completed 
              ? 'bg-green-500 border-green-500' 
              : 'border-white/40 hover:border-white/60 hover:bg-white/10'
            }
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {todo.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </motion.button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 mb-1">
              {todo.priority === 'high' && (
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300">
                    High Priority
                  </span>
                </div>
              )}
              {todo.category && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300">
                  {todo.category}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <motion.button
                onClick={() => {
                  VoiceHaptics.todoDeleted();
                  onDelete(todo.id);
                }}
                className="p-2 rounded-full hover:bg-red-500/20 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-red-400" />
              </motion.button>
            </div>
          </div>
          
          <p className={`
            text-sm leading-relaxed
            ${todo.completed 
              ? 'text-white/50 line-through' 
              : 'text-white/90'
            }
          `}>
            {todo.text}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-white/60">
              {format(todo.createdAt, 'MMM d, h:mm a')}
            </p>
            
            {todo.completed && todo.completedAt && (
              <p className="text-xs text-green-300">
                Completed {format(todo.completedAt, 'MMM d, h:mm a')}
              </p>
            )}
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
};