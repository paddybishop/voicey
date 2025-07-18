import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Target, Trash2, CheckCircle, Plus } from 'lucide-react';

interface VoiceCommandDiscoveryProps {
  onCommandSuggestion: (command: string) => void;
  isVisible: boolean;
  todoCount: number;
  hasCompletedTasks: boolean;
}

interface CommandSuggestion {
  command: string;
  description: string;
  icon: React.ReactNode;
  category: 'create' | 'manage' | 'complete' | 'delete';
  priority: number;
}

export const VoiceCommandDiscovery: React.FC<VoiceCommandDiscoveryProps> = ({
  onCommandSuggestion,
  isVisible,
  todoCount,
  hasCompletedTasks
}) => {
  const [currentSuggestion, setCurrentSuggestion] = useState(0);

  const allCommands: CommandSuggestion[] = [
    {
      command: "Add buy groceries",
      description: "Create a new task",
      icon: <Plus className="w-4 h-4" />,
      category: 'create',
      priority: 1
    },
    {
      command: "Add call mom high priority",
      description: "Create high priority task",
      icon: <Target className="w-4 h-4" />,
      category: 'create',
      priority: 2
    },
    {
      command: "Complete task 1",
      description: "Mark task as done",
      icon: <CheckCircle className="w-4 h-4" />,
      category: 'complete',
      priority: todoCount > 0 ? 3 : 8
    },
    {
      command: "Done buy groceries",
      description: "Complete by task name",
      icon: <CheckCircle className="w-4 h-4" />,
      category: 'complete',
      priority: todoCount > 0 ? 4 : 9
    },
    {
      command: "Delete task 1",
      description: "Remove a task",
      icon: <Trash2 className="w-4 h-4" />,
      category: 'delete',
      priority: todoCount > 0 ? 5 : 10
    },
    {
      command: "Clear all",
      description: "Remove all tasks",
      icon: <Trash2 className="w-4 h-4" />,
      category: 'delete',
      priority: todoCount > 2 ? 6 : 11
    },
    {
      command: "Remind me to workout",
      description: "Natural language task",
      icon: <Lightbulb className="w-4 h-4" />,
      category: 'create',
      priority: 7
    }
  ];

  // Filter and sort commands based on current app state
  const relevantCommands = allCommands
    .filter(cmd => {
      if (cmd.category === 'complete' && todoCount === 0) return false;
      if (cmd.category === 'delete' && todoCount === 0) return false;
      if (cmd.command === "Clear all" && todoCount < 2) return false;
      // Show different commands if user has completed tasks
      if (hasCompletedTasks && cmd.category === 'create') {
        return cmd.priority <= 2; // Show fewer create commands
      }
      return true;
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);

  useEffect(() => {
    if (!isVisible || relevantCommands.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSuggestion(prev => (prev + 1) % relevantCommands.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isVisible, relevantCommands.length]);

  const handleCommandClick = (command: string) => {
    onCommandSuggestion(command);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'create':
        return 'from-green-400 to-emerald-500';
      case 'complete':
        return 'from-blue-400 to-cyan-500';
      case 'delete':
        return 'from-red-400 to-rose-500';
      default:
        return 'from-purple-400 to-indigo-500';
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'create':
        return 'bg-green-500/20';
      case 'complete':
        return 'bg-blue-500/20';
      case 'delete':
        return 'bg-red-500/20';
      default:
        return 'bg-purple-500/20';
    }
  };

  if (!isVisible || relevantCommands.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-40 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-sm px-4"
    >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-xl">
        <div className="flex items-center space-x-2 mb-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lightbulb className="w-5 h-5 text-yellow-400" />
          </motion.div>
          <h3 className="text-white font-medium text-sm">Try these commands</h3>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSuggestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {relevantCommands.slice(currentSuggestion, currentSuggestion + 3).map((cmd, index) => (
              <motion.button
                key={cmd.command}
                onClick={() => handleCommandClick(cmd.command)}
                className={`w-full p-3 rounded-lg ${getCategoryBg(cmd.category)} border border-white/10 hover:border-white/30 transition-all duration-200 group`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-gradient-to-r ${getCategoryColor(cmd.category)}`}>
                    {cmd.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium text-sm group-hover:text-white/90">
                      "{cmd.command}"
                    </p>
                    <p className="text-white/60 text-xs mt-0.5">
                      {cmd.description}
                    </p>
                  </div>
                  <motion.div
                    className="w-2 h-2 rounded-full bg-white/40"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="flex justify-center space-x-1 mt-3">
          {relevantCommands.map((_, index) => (
            <motion.div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentSuggestion ? 'bg-white' : 'bg-white/30'
              }`}
              animate={{
                scale: index === currentSuggestion ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.5, repeat: index === currentSuggestion ? Infinity : 0 }}
            />
          ))}
        </div>

        {/* Quick action hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 text-center"
        >
          <p className="text-white/50 text-xs">
            Tap a command to try it out
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};