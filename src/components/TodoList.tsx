import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, Filter, CheckCircle, Circle } from 'lucide-react';
import { Todo } from '../types';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

type FilterType = 'all' | 'active' | 'completed';

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggle,
  onDelete
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  
  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    high: todos.filter(t => !t.completed && t.priority === 'high').length,
  };

  const getFilterButtonClass = (filterType: FilterType) => {
    return `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 touch-manipulation min-h-[44px] flex items-center justify-center ${
      filter === filterType
        ? 'bg-white text-primary-600 shadow-md'
        : 'bg-white/20 text-white hover:bg-white/30'
    }`;
  };

  if (todos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ListTodo className="w-16 h-16 text-white/50 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Welcome to Voice Todo!
        </h3>
        <p className="text-white/70 mb-6">
          The world's fastest voice-activated todo list
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm mx-auto mb-6">
          <h4 className="text-white font-medium mb-3">Try these commands:</h4>
          <div className="space-y-2 text-sm">
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-white/90">"Add buy groceries"</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-white/90">"Add call mom high priority"</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-white/90">"Complete task 1"</span>
            </div>
          </div>
        </div>
        
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-white/60"
        >
          <p>👇 Tap the microphone below to start</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-4 gap-2"
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-white/70">Total</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-300">{stats.active}</div>
          <div className="text-xs text-white/70">Active</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-300">{stats.completed}</div>
          <div className="text-xs text-white/70">Done</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-300">{stats.high}</div>
          <div className="text-xs text-white/70">High</div>
        </div>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg p-2"
      >
        <Filter className="w-4 h-4 text-white/70" />
        <button
          onClick={() => setFilter('all')}
          className={getFilterButtonClass('all')}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={getFilterButtonClass('active')}
        >
          <Circle className="w-3 h-3 inline mr-1" />
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={getFilterButtonClass('completed')}
        >
          <CheckCircle className="w-3 h-3 inline mr-1" />
          Done
        </button>
      </motion.div>

      {/* Todo Items */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredTodos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={index}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredTodos.length === 0 && filter !== 'all' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-white/70">
            No {filter} tasks found
          </p>
        </motion.div>
      )}
    </div>
  );
};