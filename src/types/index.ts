export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

export interface VoiceCommand {
  action: 'add' | 'complete' | 'delete' | 'edit' | 'clear' | 'unknown' | 'filter' | 'setting' | 'help' | 'summary' | 'bulk_add';
  text?: string;
  priority?: Todo['priority'];
  category?: string;
  index?: number;
}

export interface AppState {
  todos: Todo[];
  isListening: boolean;
  isProcessing: boolean;
  lastCommand?: string;
  error?: string;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}