import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Mic, Volume2, Globe, Gauge, X, Save } from 'lucide-react';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: VoiceSettings) => void;
}

export interface VoiceSettings {
  language: string;
  sensitivity: number;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  autoStart: boolean;
  continuousMode: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
}

const languages = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' }
];

export const VoiceSettingsPanel: React.FC<VoiceSettingsProps> = ({
  isOpen,
  onClose,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<VoiceSettings>({
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

  const [activeTab, setActiveTab] = useState<'speech' | 'voice' | 'advanced'>('speech');

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('voice-todo-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading voice settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('voice-todo-settings', JSON.stringify(newSettings));
    
    // Notify parent component
    onSettingsChange(newSettings);
  };

  const handleSave = () => {
    onSettingsChange(settings);
    onClose();
  };

  const testVoice = () => {
    const utterance = new SpeechSynthesisUtterance('This is a test of your voice settings');
    utterance.rate = settings.voiceRate;
    utterance.pitch = settings.voicePitch;
    utterance.volume = settings.voiceVolume;
    utterance.lang = settings.language;
    speechSynthesis.speak(utterance);
  };

  const SliderControl = ({ 
    label, 
    value, 
    onChange, 
    min, 
    max, 
    step, 
    unit = '' 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    unit?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-white text-sm font-medium">{label}</label>
        <span className="text-white/60 text-xs">{value.toFixed(2)}{unit}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
        />
        <div 
          className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg pointer-events-none"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );

  const ToggleSwitch = ({ 
    label, 
    checked, 
    onChange, 
    description 
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-white text-sm font-medium">{label}</label>
        {description && (
          <p className="text-white/60 text-xs mt-1">{description}</p>
        )}
      </div>
      <motion.button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-white/20'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-white" />
                    <h2 className="text-white font-semibold">Voice Settings</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/20">
                {[
                  { id: 'speech', label: 'Speech', icon: <Mic className="w-4 h-4" /> },
                  { id: 'voice', label: 'Voice', icon: <Volume2 className="w-4 h-4" /> },
                  { id: 'advanced', label: 'Advanced', icon: <Gauge className="w-4 h-4" /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 p-3 flex items-center justify-center space-x-2 transition-colors ${
                      activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {activeTab === 'speech' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Language</span>
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code} className="bg-gray-800">
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <SliderControl
                      label="Sensitivity"
                      value={settings.sensitivity}
                      onChange={(value) => handleSettingChange('sensitivity', value)}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                    />

                    <ToggleSwitch
                      label="Continuous Mode"
                      checked={settings.continuousMode}
                      onChange={(checked) => handleSettingChange('continuousMode', checked)}
                      description="Keep listening after each command"
                    />

                    <ToggleSwitch
                      label="Auto Start"
                      checked={settings.autoStart}
                      onChange={(checked) => handleSettingChange('autoStart', checked)}
                      description="Start listening when app opens"
                    />
                  </div>
                )}

                {activeTab === 'voice' && (
                  <div className="space-y-4">
                    <SliderControl
                      label="Speech Rate"
                      value={settings.voiceRate}
                      onChange={(value) => handleSettingChange('voiceRate', value)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />

                    <SliderControl
                      label="Pitch"
                      value={settings.voicePitch}
                      onChange={(value) => handleSettingChange('voicePitch', value)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />

                    <SliderControl
                      label="Volume"
                      value={settings.voiceVolume}
                      onChange={(value) => handleSettingChange('voiceVolume', value)}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                    />

                    <button
                      onClick={testVoice}
                      className="w-full p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white font-medium transition-colors"
                    >
                      Test Voice
                    </button>
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div className="space-y-4">
                    <ToggleSwitch
                      label="Noise Suppression"
                      checked={settings.noiseSuppression}
                      onChange={(checked) => handleSettingChange('noiseSuppression', checked)}
                      description="Reduce background noise"
                    />

                    <ToggleSwitch
                      label="Echo Cancellation"
                      checked={settings.echoCancellation}
                      onChange={(checked) => handleSettingChange('echoCancellation', checked)}
                      description="Prevent feedback loops"
                    />

                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-200 text-sm">
                        <strong>Note:</strong> Advanced settings may require browser restart to take effect.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/20">
                <div className="flex space-x-2">
                  <button
                    onClick={onClose}
                    className="flex-1 p-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};