import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface VoiceWaveformProps {
  isListening: boolean;
  audioLevel?: number;
  className?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isListening,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Initialize audio context and analyser when listening starts
  useEffect(() => {
    if (isListening && !audioContext) {
      initializeAudioAnalysis();
    } else if (!isListening && audioContext) {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isListening]);

  const initializeAudioAnalysis = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const analyserNode = context.createAnalyser();
      const source = context.createMediaStreamSource(mediaStream);
      
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      source.connect(analyserNode);
      
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      setAudioContext(context);
      setAnalyser(analyserNode);
      setDataArray(dataArray);
      setStream(mediaStream);
    } catch (error) {
      console.error('Error initializing audio analysis:', error);
    }
  };

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
      audioContext.close();
    }
    setAudioContext(null);
    setAnalyser(null);
    setDataArray(null);
    setStream(null);
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyser || !dataArray) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyser.getByteFrequencyData(dataArray);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedVolume = average / 255;

    // Draw waveform bars
    const barWidth = canvas.width / dataArray.length;
    const centerY = canvas.height / 2;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
      const x = i * barWidth;
      
      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
      gradient.addColorStop(0, `rgba(239, 68, 68, ${0.8 + normalizedVolume * 0.2})`);
      gradient.addColorStop(0.5, `rgba(249, 115, 22, ${0.6 + normalizedVolume * 0.4})`);
      gradient.addColorStop(1, `rgba(234, 179, 8, ${0.4 + normalizedVolume * 0.6})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
    }

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    animationRef.current = requestAnimationFrame(drawWaveform);
  };

  useEffect(() => {
    if (isListening && analyser && dataArray) {
      drawWaveform();
    }
  }, [isListening, analyser, dataArray]);

  // Static waveform for when not listening
  const staticBars = Array.from({ length: 32 }, (_, i) => ({
    height: Math.sin(i * 0.2) * 20 + 30,
    delay: i * 0.02
  }));

  return (
    <div className={`relative ${className}`}>
      {isListening && analyser ? (
        <canvas
          ref={canvasRef}
          width={200}
          height={60}
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.3))' }}
        />
      ) : (
        <div className="flex items-center justify-center h-full space-x-1">
          {staticBars.map((bar, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-t from-blue-400 to-purple-500 rounded-full"
              style={{
                width: '3px',
                height: `${bar.height}%`,
                minHeight: '4px'
              }}
              animate={{
                height: isListening ? [`${bar.height}%`, `${bar.height * 1.5}%`, `${bar.height}%`] : `${bar.height * 0.3}%`,
                opacity: isListening ? [0.4, 0.8, 0.4] : 0.3
              }}
              transition={{
                duration: 1.5,
                repeat: isListening ? Infinity : 0,
                delay: bar.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};