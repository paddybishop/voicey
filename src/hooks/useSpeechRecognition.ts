import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceAnalytics {
  totalAttempts: number;
  successfulRecognitions: number;
  averageConfidence: number;
  errorRate: number;
  lastErrorType?: string;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  isVoiceDetected: boolean;
  dynamicConfidenceThreshold: number;
  analytics: VoiceAnalytics;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  adjustConfidenceThreshold: (threshold: number) => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);
  const [dynamicConfidenceThreshold, setDynamicConfidenceThreshold] = useState(0.5);
  const [analytics, setAnalytics] = useState<VoiceAnalytics>({
    totalAttempts: 0,
    successfulRecognitions: 0,
    averageConfidence: 0,
    errorRate: 0
  });
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const confidenceHistoryRef = useRef<number[]>([]);
  const voiceActivityRef = useRef<boolean>(false);
  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  // Dynamic confidence threshold adjustment based on historical performance
  const adjustConfidenceThreshold = useCallback((threshold: number) => {
    setDynamicConfidenceThreshold(Math.max(0.1, Math.min(1.0, threshold)));
  }, []);

  // Update analytics with new recognition result
  const updateAnalytics = useCallback((success: boolean, confidenceScore?: number, errorType?: string) => {
    setAnalytics(prev => {
      const newTotalAttempts = prev.totalAttempts + 1;
      const newSuccessfulRecognitions = success ? prev.successfulRecognitions + 1 : prev.successfulRecognitions;
      const newErrorRate = ((newTotalAttempts - newSuccessfulRecognitions) / newTotalAttempts) * 100;
      
      let newAverageConfidence = prev.averageConfidence;
      if (success && confidenceScore !== undefined) {
        confidenceHistoryRef.current.push(confidenceScore);
        if (confidenceHistoryRef.current.length > 10) {
          confidenceHistoryRef.current.shift();
        }
        newAverageConfidence = confidenceHistoryRef.current.reduce((a, b) => a + b, 0) / confidenceHistoryRef.current.length;
        
        // Auto-adjust confidence threshold based on performance
        if (newAverageConfidence > 0.8 && prev.errorRate < 10) {
          setDynamicConfidenceThreshold(Math.max(0.3, newAverageConfidence - 0.2));
        } else if (newAverageConfidence < 0.6 || prev.errorRate > 20) {
          setDynamicConfidenceThreshold(Math.min(0.7, newAverageConfidence + 0.1));
        }
      }
      
      return {
        totalAttempts: newTotalAttempts,
        successfulRecognitions: newSuccessfulRecognitions,
        averageConfidence: newAverageConfidence,
        errorRate: newErrorRate,
        lastErrorType: errorType
      };
    });
  }, []);

  // Voice activity detection
  const detectVoiceActivity = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        source.connect(analyzer);

        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        const checkActivity = () => {
          analyzer.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const isActive = average > 30; // Threshold for voice activity
          
          if (isActive !== voiceActivityRef.current) {
            voiceActivityRef.current = isActive;
            setIsVoiceDetected(isActive);
          }
          
          if (isListening) {
            requestAnimationFrame(checkActivity);
          }
        };
        
        if (isListening) {
          checkActivity();
        }
      })
      .catch(error => {
        console.warn('Voice activity detection failed:', error);
      });
  }, [isListening]);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3; // Increase alternatives for better accuracy

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      retryCountRef.current = 0;
      detectVoiceActivity();
      
      // Set timeout for maximum listening duration
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setError('Listening timeout. Please try again.');
        }
      }, 10000); // 10 second timeout
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      if (result) {
        // Try multiple alternatives to find the best match
        let bestResult = result[0];
        let bestConfidence = result[0].confidence || 0;
        
        // Check all alternatives if available
        for (let i = 0; i < result.length; i++) {
          const alternative = result[i];
          const confidence = alternative.confidence || 0;
          
          // Prefer results with higher confidence and better keyword matching
          if (confidence > bestConfidence || 
              (confidence >= bestConfidence * 0.9 && hasKeywords(alternative.transcript))) {
            bestResult = alternative;
            bestConfidence = confidence;
          }
        }
        
        setTranscript(bestResult.transcript);
        setConfidence(bestConfidence);
        
        // Update analytics with successful recognition
        if (result.isFinal) {
          updateAnalytics(true, bestConfidence);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsVoiceDetected(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setIsVoiceDetected(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const errorType = event.error;
      updateAnalytics(false, undefined, errorType);
      
      // Enhanced error handling with retry logic
      if (errorType === 'no-speech') {
        if (retryCountRef.current < 2) {
          retryCountRef.current++;
          setError(`No speech detected. Retrying... (${retryCountRef.current}/3)`);
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (retryError) {
                setError('Failed to retry. Please try again manually.');
              }
            }
          }, 1000);
        } else {
          setError('No speech detected after multiple attempts. Please speak clearly and try again.');
        }
      } else if (errorType === 'audio-capture') {
        setError('Microphone access denied. Please allow microphone access and refresh the page.');
      } else if (errorType === 'not-allowed') {
        setError('Microphone access not allowed. Please check browser settings and allow microphone access.');
      } else if (errorType === 'network') {
        setError('Network error. Please check your connection and try again.');
      } else if (errorType === 'service-not-allowed') {
        setError('Speech recognition service not available. Please try again later.');
      } else {
        setError(`Speech recognition error: ${errorType}. Please try again.`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isSupported, updateAnalytics, detectVoiceActivity]);

  // Helper function to check for common voice command keywords
  const hasKeywords = (text: string): boolean => {
    const keywords = ['add', 'create', 'new', 'todo', 'complete', 'done', 'delete', 'remove', 'clear'];
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  };

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) return;
    
    // Prevent multiple simultaneous listening sessions
    if (isListening) {
      return;
    }
    
    setError(null);
    setTranscript('');
    setConfidence(0);
    setIsVoiceDetected(false);
    retryCountRef.current = 0;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      updateAnalytics(false, undefined, 'start-error');
      setError('Failed to start speech recognition. Please try again.');
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      setError('Failed to stop speech recognition');
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setConfidence(0);
    setError(null);
    setIsVoiceDetected(false);
  };

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    isVoiceDetected,
    dynamicConfidenceThreshold,
    analytics,
    startListening,
    stopListening,
    resetTranscript,
    adjustConfidenceThreshold
  };
};