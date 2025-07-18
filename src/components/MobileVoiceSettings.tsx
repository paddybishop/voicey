import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Smartphone, 
  Volume2, 
  Vibrate, 
  Moon, 
  Zap, 
  Settings,
  Mic,
  Speaker,
  Shield,
  Accessibility,
  TouchpadIcon,
  Headphones
} from 'lucide-react';
import { HapticFeedback, MobileUtils } from '../utils/haptic';

interface MobileVoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: MobileVoiceSettings) => void;
}

export interface MobileVoiceSettings {
  // Voice Recognition Settings
  language: string;
  sensitivity: number;
  continuousMode: boolean;
  
  // Mobile-specific settings
  hapticFeedback: boolean;
  hapticIntensity: 'light' | 'medium' | 'heavy';
  screenWakeLock: boolean;
  touchGestures: boolean;
  
  // Voice feedback settings
  voiceConfirmation: boolean;
  voiceRate: number;
  voiceVolume: number;
  
  // Accessibility settings
  screenReaderSupport: boolean;
  visualFeedback: boolean;
  largeText: boolean;
  
  // Audio settings
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

const DEFAULT_SETTINGS: MobileVoiceSettings = {
  language: 'en-US',
  sensitivity: 0.5,
  continuousMode: false,
  hapticFeedback: true,
  hapticIntensity: 'medium',
  screenWakeLock: true,
  touchGestures: true,
  voiceConfirmation: true,
  voiceRate: 1.0,
  voiceVolume: 0.8,
  screenReaderSupport: false,
  visualFeedback: true,
  largeText: false,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true
};

export const MobileVoiceSettings: React.FC<MobileVoiceSettingsProps> = ({
  isOpen,
  onClose,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<MobileVoiceSettings>(() => {
    const saved = localStorage.getItem('mobile-voice-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState<'voice' | 'mobile' | 'accessibility' | 'audio'>('mobile');

  const updateSetting = <K extends keyof MobileVoiceSettings>(
    key: K,
    value: MobileVoiceSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('mobile-voice-settings', JSON.stringify(newSettings));
    onSettingsChange(newSettings);
    
    // Provide haptic feedback for setting changes
    if (key === 'hapticFeedback' && value) {
      HapticFeedback.trigger('selection');
    }
  };

  const testHaptic = (intensity: 'light' | 'medium' | 'heavy') => {
    HapticFeedback.trigger(intensity);
  };

  const tabs = [
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'accessibility', label: 'Access', icon: Accessibility },
    { id: 'audio', label: 'Audio', icon: Headphones }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="w-full max-h-[90vh] bg-white/10 backdrop-blur-md rounded-t-3xl border-t border-white/20 p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Mobile Voice Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 bg-white/10 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Mobile Settings */}
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Vibrate className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Haptic Feedback</div>
                    <div className="text-white/60 text-sm">Feel vibrations for voice actions</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('hapticFeedback', !settings.hapticFeedback)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.hapticFeedback ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.hapticFeedback ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {settings.hapticFeedback && (
                <div className="ml-8 space-y-2">
                  <div className="text-white/80 text-sm">Haptic Intensity</div>
                  <div className="flex space-x-2">
                    {(['light', 'medium', 'heavy'] as const).map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => {
                          updateSetting('hapticIntensity', intensity);
                          testHaptic(intensity);
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          settings.hapticIntensity === intensity
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/20 text-white/80 hover:bg-white/30'
                        }`}
                      >
                        {intensity}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Moon className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium">Keep Screen On</div>
                    <div className="text-white/60 text-sm">Prevent screen from sleeping during voice recording</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('screenWakeLock', !settings.screenWakeLock)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.screenWakeLock ? 'bg-purple-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.screenWakeLock ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TouchpadIcon className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">Touch Gestures</div>
                    <div className="text-white/60 text-sm">Swipe to complete or delete tasks</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('touchGestures', !settings.touchGestures)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.touchGestures ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.touchGestures ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Voice Settings */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Speaker className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Voice Confirmation</div>
                    <div className="text-white/60 text-sm">Hear voice feedback for actions</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('voiceConfirmation', !settings.voiceConfirmation)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.voiceConfirmation ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.voiceConfirmation ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium">Voice Speed</div>
                  <div className="text-white/60 text-sm">{settings.voiceRate.toFixed(1)}x</div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.voiceRate}
                  onChange={(e) => updateSetting('voiceRate', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium">Voice Volume</div>
                  <div className="text-white/60 text-sm">{Math.round(settings.voiceVolume * 100)}%</div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={settings.voiceVolume}
                  onChange={(e) => updateSetting('voiceVolume', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium">Voice Sensitivity</div>
                  <div className="text-white/60 text-sm">{Math.round(settings.sensitivity * 100)}%</div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={settings.sensitivity}
                  onChange={(e) => updateSetting('sensitivity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Accessibility Settings */}
          {activeTab === 'accessibility' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Accessibility className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">Screen Reader Support</div>
                    <div className="text-white/60 text-sm">Enhanced screen reader compatibility</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('screenReaderSupport', !settings.screenReaderSupport)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.screenReaderSupport ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.screenReaderSupport ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-white font-medium">Visual Feedback</div>
                    <div className="text-white/60 text-sm">Show visual indicators for voice actions</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('visualFeedback', !settings.visualFeedback)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.visualFeedback ? 'bg-yellow-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.visualFeedback ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium">Large Text</div>
                    <div className="text-white/60 text-sm">Increase text size for better readability</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('largeText', !settings.largeText)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.largeText ? 'bg-purple-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.largeText ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Audio Settings */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Noise Suppression</div>
                    <div className="text-white/60 text-sm">Reduce background noise</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('noiseSuppression', !settings.noiseSuppression)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.noiseSuppression ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.noiseSuppression ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Headphones className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">Echo Cancellation</div>
                    <div className="text-white/60 text-sm">Remove echo from microphone</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('echoCancellation', !settings.echoCancellation)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.echoCancellation ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.echoCancellation ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium">Auto Gain Control</div>
                    <div className="text-white/60 text-sm">Automatically adjust microphone volume</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('autoGainControl', !settings.autoGainControl)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.autoGainControl ? 'bg-purple-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.autoGainControl ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Device Info */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg">
          <div className="text-white/80 text-sm">
            <div className="font-medium mb-1">Device Information</div>
            <div>Mobile: {MobileUtils.isMobile() ? 'Yes' : 'No'}</div>
            <div>Touch Support: {MobileUtils.getTouchSupport() ? 'Yes' : 'No'}</div>
            <div>Haptic Support: {navigator.vibrate ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};