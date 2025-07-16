import { Todo } from '../types';

const STORAGE_KEY = 'voice-todo-app-data';

export const loadTodos = (): Todo[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    
    const parsed = JSON.parse(saved);
    return parsed.todos?.map((todo: any) => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined
    })) || [];
  } catch (error) {
    console.error('Failed to load todos from storage:', error);
    return [];
  }
};

export const saveTodos = (todos: Todo[]): void => {
  try {
    const data = {
      todos,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save todos to storage:', error);
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};