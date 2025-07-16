import { useState, useEffect, useRef } from 'react';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      if (result) {
        setTranscript(result[0].transcript);
        setConfidence(result[0].confidence);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setError(event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        setError('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access not allowed. Please check browser settings.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported]);

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) return;
    
    setError(null);
    setTranscript('');
    setConfidence(0);
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      setError('Failed to start speech recognition');
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      setError('Failed to stop speech recognition');
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  };

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};