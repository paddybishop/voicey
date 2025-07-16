import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Todo, VoiceCommand } from '../types';
import { loadTodos, saveTodos } from '../utils/storage';
import { speak } from '../utils/speech';

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const savedTodos = loadTodos();
    setTodos(savedTodos);
  }, []);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = (text: string, priority: Todo['priority'] = 'low', category?: string) => {
    const newTodo: Todo = {
      id: nanoid(),
      text: text.trim(),
      completed: false,
      createdAt: new Date(),
      priority,
      category
    };
    
    setTodos(prev => [newTodo, ...prev]);
    speak(`Added task: ${text}`);
  };

  const completeTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, completed: true, completedAt: new Date() }
        : todo
    ));
    
    const todo = todos.find(t => t.id === id);
    if (todo) {
      speak(`Completed task: ${todo.text}`);
    }
  };

  const deleteTodo = (id: string) => {
    const todo = todos.find(t => t.id === id);
    setTodos(prev => prev.filter(t => t.id !== id));
    
    if (todo) {
      speak(`Deleted task: ${todo.text}`);
    }
  };

  const clearAllTodos = () => {
    setTodos([]);
    speak('All tasks cleared');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { 
            ...todo, 
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date() : undefined
          }
        : todo
    ));
  };

  const findTodoByText = (text: string): Todo | undefined => {
    return todos.find(todo => 
      todo.text.toLowerCase().includes(text.toLowerCase())
    );
  };

  const findTodoByIndex = (index: number): Todo | undefined => {
    const activeTodos = todos.filter(t => !t.completed);
    return activeTodos[index];
  };

  const executeVoiceCommand = async (command: VoiceCommand) => {
    setIsProcessing(true);
    
    try {
      switch (command.action) {
        case 'add':
          if (command.text) {
            addTodo(command.text, command.priority, command.category);
          }
          break;
          
        case 'complete':
          if (command.index !== undefined) {
            const todo = findTodoByIndex(command.index);
            if (todo) {
              completeTodo(todo.id);
            } else {
              speak('Task not found');
            }
          } else if (command.text) {
            const todo = findTodoByText(command.text);
            if (todo) {
              completeTodo(todo.id);
            } else {
              speak('Task not found');
            }
          }
          break;
          
        case 'delete':
          if (command.index !== undefined) {
            const todo = findTodoByIndex(command.index);
            if (todo) {
              deleteTodo(todo.id);
            } else {
              speak('Task not found');
            }
          } else if (command.text) {
            const todo = findTodoByText(command.text);
            if (todo) {
              deleteTodo(todo.id);
            } else {
              speak('Task not found');
            }
          }
          break;
          
        case 'clear':
          clearAllTodos();
          break;
          
        case 'unknown':
          speak('Sorry, I did not understand that command. Try saying add, complete, delete, or clear all.');
          break;
      }
    } catch (error) {
      console.error('Error executing voice command:', error);
      speak('Sorry, there was an error processing your command.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    todos,
    isProcessing,
    addTodo,
    completeTodo,
    deleteTodo,
    clearAllTodos,
    toggleTodo,
    executeVoiceCommand
  };
};