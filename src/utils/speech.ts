import { VoiceCommand, Todo } from '../types';
import { VoiceHaptics, MobileUtils } from './haptic';

export const checkSpeechSupport = (): boolean => {
  return 'speechSynthesis' in window && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

export const speak = (text: string, rate: number = 1.0): void => {
  if (!('speechSynthesis' in window)) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 0.8;
  
  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.name.includes('Samantha') || 
    voice.name.includes('Alex') ||
    voice.name.includes('Google')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  speechSynthesis.speak(utterance);
};

export const parseVoiceCommand = (transcript: string): VoiceCommand => {
  const text = transcript.toLowerCase().trim();
  
  // Mobile-specific voice commands
  const mobileCommands = parseMobileCommands(text);
  if (mobileCommands) {
    return mobileCommands;
  }
  
  // Add task commands
  const addPatterns = [
    /^add (.+)$/,
    /^create (.+)$/,
    /^new (.+)$/,
    /^todo (.+)$/,
    /^remind me to (.+)$/,
    /^i need to (.+)$/,
    // Mobile-friendly variations
    /^hey add (.+)$/,
    /^okay add (.+)$/,
    /^please add (.+)$/,
    /^can you add (.+)$/,
  ];
  
  for (const pattern of addPatterns) {
    const match = text.match(pattern);
    if (match) {
      const taskText = match[1];
      const priority = extractPriority(taskText);
      const category = extractCategory(taskText);
      const cleanText = cleanTaskText(taskText);
      
      return {
        action: 'add',
        text: cleanText,
        priority,
        category
      };
    }
  }
  
  // Complete task commands
  const completePatterns = [
    /^complete (.+)$/,
    /^done (.+)$/,
    /^finish (.+)$/,
    /^mark (.+) as (?:done|complete)$/,
    /^complete task (\d+)$/,
    /^done with task (\d+)$/,
  ];
  
  for (const pattern of completePatterns) {
    const match = text.match(pattern);
    if (match) {
      const taskRef = match[1];
      const index = parseInt(taskRef) - 1;
      
      return {
        action: 'complete',
        text: isNaN(index) ? taskRef : undefined,
        index: isNaN(index) ? undefined : index
      };
    }
  }
  
  // Delete task commands
  const deletePatterns = [
    /^delete (.+)$/,
    /^remove (.+)$/,
    /^cancel (.+)$/,
    /^delete task (\d+)$/,
    /^remove task (\d+)$/,
  ];
  
  for (const pattern of deletePatterns) {
    const match = text.match(pattern);
    if (match) {
      const taskRef = match[1];
      const index = parseInt(taskRef) - 1;
      
      return {
        action: 'delete',
        text: isNaN(index) ? taskRef : undefined,
        index: isNaN(index) ? undefined : index
      };
    }
  }
  
  // Clear all tasks
  if (text.includes('clear all') || text.includes('delete all') || text.includes('remove all')) {
    return { action: 'clear' };
  }
  
  // Unknown command
  return { action: 'unknown', text: transcript };
};

const extractPriority = (text: string): Todo['priority'] => {
  if (text.includes('urgent') || text.includes('high priority') || text.includes('important')) {
    return 'high';
  }
  if (text.includes('medium priority') || text.includes('normal')) {
    return 'medium';
  }
  return 'low';
};

const extractCategory = (text: string): string | undefined => {
  const categoryPatterns = [
    /(?:in|for|under) (\w+) category/,
    /categorize as (\w+)/,
    /tag (\w+)/,
  ];
  
  for (const pattern of categoryPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
};

const cleanTaskText = (text: string): string => {
  return text
    .replace(/\b(urgent|high priority|important|medium priority|normal|low priority)\b/gi, '')
    .replace(/\b(?:in|for|under) \w+ category\b/gi, '')
    .replace(/\bcategorize as \w+\b/gi, '')
    .replace(/\btag \w+\b/gi, '')
    .trim();
};

// Mobile-specific voice commands
const parseMobileCommands = (text: string): VoiceCommand | null => {
  // Quick action commands for mobile
  if (text.includes('show completed') || text.includes('show done')) {
    return { action: 'filter', text: 'completed' };
  }
  
  if (text.includes('show active') || text.includes('show pending')) {
    return { action: 'filter', text: 'active' };
  }
  
  if (text.includes('show all')) {
    return { action: 'filter', text: 'all' };
  }
  
  // Voice settings commands
  if (text.includes('enable haptics') || text.includes('turn on vibration')) {
    return { action: 'setting', text: 'haptics:on' };
  }
  
  if (text.includes('disable haptics') || text.includes('turn off vibration')) {
    return { action: 'setting', text: 'haptics:off' };
  }
  
  // Mobile-friendly help
  if (text.includes('help') || text.includes('what can you do') || text.includes('commands')) {
    return { action: 'help' };
  }
  
  // Quick voice summary
  if (text.includes('summary') || text.includes('status') || text.includes('how am i doing')) {
    return { action: 'summary' };
  }
  
  // Mobile multitasking
  if (text.includes('add multiple') || text.includes('bulk add')) {
    return { action: 'bulk_add' };
  }
  
  return null;
};

export const getVoiceCommands = (): string[] => {
  const basicCommands = [
    "Add [task]",
    "Create [task]", 
    "New [task]",
    "Todo [task]",
    "Remind me to [task]",
    "Complete [task]",
    "Done [task]",
    "Complete task [number]",
    "Delete [task]",
    "Remove [task]",
    "Delete task [number]",
    "Clear all",
    "Delete all"
  ];
  
  // Add mobile-specific commands when on mobile
  if (MobileUtils.isMobile()) {
    return [
      ...basicCommands,
      "Show completed",
      "Show active", 
      "Show all",
      "Enable haptics",
      "Disable haptics",
      "Help",
      "Summary",
      "Status",
      "Add multiple tasks"
    ];
  }
  
  return basicCommands;
};

export const getTaskSummary = (todos: Todo[]): string => {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pending = total - completed;
  
  if (total === 0) {
    return "You have no tasks. Great job staying on top of things!";
  }
  
  if (pending === 0) {
    return `All ${total} tasks completed! You're crushing it!`;
  }
  
  return `You have ${pending} task${pending === 1 ? '' : 's'} remaining out of ${total} total.`;
};