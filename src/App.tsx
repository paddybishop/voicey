import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { VoiceButton } from './components/VoiceButton';
import { TodoList } from './components/TodoList';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VoiceCommandDiscovery } from './components/VoiceCommandDiscovery';
import { AccessibilityIndicators } from './components/AccessibilityIndicators';
import { VoiceSettingsPanel, VoiceSettings } from './components/VoiceSettingsPanel';
import { MobileAccessibility } from './components/MobileAccessibility';
import { MobileVoiceSettings } from './components/MobileVoiceSettings';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTodos } from './hooks/useTodos';
import { parseVoiceCommand, speak, getTaskSummary } from './utils/speech';
import { Sparkles, Volume2, VolumeX, HelpCircle, Settings } from 'lucide-react';
import { MobileUtils, VoiceHaptics } from './utils/haptic';

const App: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastInteraction, setLastInteraction] = useState<Date>(new Date());
  const [showCommandDiscovery, setShowCommandDiscovery] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [visualMode, setVisualMode] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    language: 'en-US',
    sensitivity: 0.5,
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceVolume: 0.8,
    autoStart: false,
    continuousMode: false,
    noiseSuppression: true,
    echoCancellation: true
  });
  
  const {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();
  
  const {
    todos,
    isProcessing,
    toggleTodo,
    deleteTodo,
    executeVoiceCommand
  } = useTodos();

  // Handle voice command when speech recognition completes
  useEffect(() => {
    if (transcript && !isListening && confidence > 0.5) {
      const command = parseVoiceCommand(transcript);
      executeVoiceCommand(command);
      resetTranscript();
      setLastInteraction(new Date());
    }
  }, [transcript, isListening, confidence, executeVoiceCommand, resetTranscript]);

  // Welcome message on first load
  useEffect(() => {
    const hasVisited = localStorage.getItem('voice-todo-visited');
    if (!hasVisited && soundEnabled) {
      setTimeout(() => {
        speak('Welcome to Voice Todo! Your fastest, most beautiful voice-activated todo list. Tap the microphone and say add followed by your task.', voiceSettings.voiceRate);
        localStorage.setItem('voice-todo-visited', 'true');
        setShowCommandDiscovery(true);
      }, 1000);
    }
  }, [soundEnabled, voiceSettings.voiceRate]);

  // Show command discovery for new users
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todos.length === 0 && !isListening) {
        setShowCommandDiscovery(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [todos.length, isListening]);

  // Periodic encouragement
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeSinceLastInteraction = now.getTime() - lastInteraction.getTime();
      
      if (timeSinceLastInteraction > 300000 && todos.length > 0 && soundEnabled) { // 5 minutes
        const activeTodos = todos.filter(t => !t.completed);
        if (activeTodos.length > 0) {
          speak(`You have ${activeTodos.length} task${activeTodos.length === 1 ? '' : 's'} waiting. Keep going!`);
        }
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [lastInteraction, todos, soundEnabled]);

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      speak('Sound enabled');
    }
  };

  const handleSummary = () => {
    const summary = getTaskSummary(todos);
    speak(summary, voiceSettings.voiceRate);
    setLastInteraction(new Date());
  };

  const handleCommandSuggestion = (command: string) => {
    const parsedCommand = parseVoiceCommand(command);
    executeVoiceCommand(parsedCommand);
    setShowCommandDiscovery(false);
    setLastInteraction(new Date());
  };

  const handleVoiceSettingsChange = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
  };

  const handleMobileSettingsChange = (newSettings: any) => {
    // Handle mobile-specific settings
    console.log('Mobile settings changed:', newSettings);
  };

  const handleAnnouncement = (message: string) => {
    if (soundEnabled) {
      speak(message, voiceSettings.voiceRate);
    }
  };

  const handleRefresh = async () => {
    // Simulate refresh action
    VoiceHaptics.commandProcessed();
    await new Promise(resolve => setTimeout(resolve, 1000));
    speak('Todo list refreshed', voiceSettings.voiceRate);
  };

  const handleToggleVisualMode = () => {
    setVisualMode(!visualMode);
  };

  const commands = [
    "Add buy groceries",
    "Add call mom high priority", 
    "Create workout plan",
    "Complete task 1",
    "Done buy groceries",
    "Delete task 2",
    "Remove call mom",
    "Clear all"
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="p-4 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <Sparkles className="w-8 h-8 text-yellow-300" />
              <h1 className="text-2xl font-bold text-white">Voice Todo</h1>
            </motion.div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSoundToggle}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-white" />
                ) : (
                  <VolumeX className="w-5 h-5 text-white" />
                )}
              </button>
              
              <button
                onClick={handleSummary}
                className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-sm"
              >
                Summary
              </button>
              
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={() => MobileUtils.isMobile() ? setShowMobileSettings(true) : setShowVoiceSettings(true)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </header>

          {/* Help Panel */}
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-3">Voice Commands</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {commands.map((command, index) => (
                  <div key={index} className="text-sm text-white/80 bg-white/5 rounded-lg p-2">
                    "{command}"
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-4 bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30"
            >
              <p className="text-red-100 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Main Content */}
          <main className="flex-1 p-4 pb-32">
            <div className="max-w-md mx-auto">
              <TodoList
                todos={todos}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onRefresh={handleRefresh}
              />
            </div>
          </main>

          {/* Voice Button - Fixed at bottom */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <VoiceButton
              isListening={isListening}
              isProcessing={isProcessing}
              isSupported={isSupported}
              onStartListening={startListening}
              onStopListening={stopListening}
              transcript={transcript}
            />
          </div>

          {/* Voice Command Discovery */}
          <VoiceCommandDiscovery
            onCommandSuggestion={handleCommandSuggestion}
            isVisible={showCommandDiscovery}
            todoCount={todos.length}
            hasCompletedTasks={todos.some(t => t.completed)}
          />

          {/* Accessibility Indicators */}
          <AccessibilityIndicators
            isListening={isListening}
            isProcessing={isProcessing}
            transcript={transcript}
            error={error}
            soundEnabled={soundEnabled}
            onToggleSound={handleSoundToggle}
            onToggleVisualMode={handleToggleVisualMode}
          />

          {/* Voice Settings Panel */}
          <VoiceSettingsPanel
            isOpen={showVoiceSettings}
            onClose={() => setShowVoiceSettings(false)}
            onSettingsChange={handleVoiceSettingsChange}
          />

          {/* Mobile Voice Settings Panel */}
          <MobileVoiceSettings
            isOpen={showMobileSettings}
            onClose={() => setShowMobileSettings(false)}
            onSettingsChange={handleMobileSettingsChange}
          />

          {/* Mobile Accessibility */}
          <MobileAccessibility
            isListening={isListening}
            isProcessing={isProcessing}
            transcript={transcript}
            error={error}
            onAnnounce={handleAnnouncement}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;