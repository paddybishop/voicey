import { useState, useEffect, useRef } from 'react';

interface VoiceActivityState {
  audioLevel: number;
  isVoiceDetected: boolean;
  confidence: number;
  frequency: number;
}

export const useVoiceActivity = (isListening: boolean) => {
  const [voiceActivity, setVoiceActivity] = useState<VoiceActivityState>({
    audioLevel: 0,
    isVoiceDetected: false,
    confidence: 0,
    frequency: 0
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isListening) {
      initializeAudioAnalysis();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isListening]);

  const initializeAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      streamRef.current = stream;

      startAnalysis();
    } catch (error) {
      console.error('Error initializing voice activity detection:', error);
    }
  };

  const startAnalysis = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    const analyze = () => {
      analyser.getByteTimeDomainData(dataArray);
      analyser.getByteFrequencyData(frequencyData);

      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const sample = (dataArray[i] - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const audioLevel = Math.min(rms * 10, 1); // Normalize to 0-1

      // Voice activity detection
      const isVoiceDetected = audioLevel > 0.01;

      // Calculate dominant frequency
      let maxValue = 0;
      let maxIndex = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxValue) {
          maxValue = frequencyData[i];
          maxIndex = i;
        }
      }
      const frequency = (maxIndex * audioContextRef.current!.sampleRate) / (analyser.fftSize * 2);

      // Calculate confidence based on signal strength and frequency characteristics
      const confidence = Math.min(audioLevel * 2, 1);

      setVoiceActivity({
        audioLevel,
        isVoiceDetected,
        confidence,
        frequency
      });

      if (isListening) {
        animationRef.current = requestAnimationFrame(analyze);
      }
    };

    analyze();
  };

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    
    setVoiceActivity({
      audioLevel: 0,
      isVoiceDetected: false,
      confidence: 0,
      frequency: 0
    });
  };

  return voiceActivity;
};