import { useRef, useState, useEffect } from 'react';

interface SwipeGestureState {
  isSwipeActive: boolean;
  swipeDirection: 'left' | 'right' | null;
  swipeDistance: number;
  swipeVelocity: number;
}

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 100,
    velocityThreshold = 0.3,
    preventScroll = true
  } = options;

  const [gestureState, setGestureState] = useState<SwipeGestureState>({
    isSwipeActive: false,
    swipeDirection: null,
    swipeDistance: 0,
    swipeVelocity: 0
  });

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    setGestureState(prev => ({
      ...prev,
      isSwipeActive: true,
      swipeDirection: null,
      swipeDistance: 0,
      swipeVelocity: 0
    }));
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current || !touchCurrentRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Only consider horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (preventScroll) {
        e.preventDefault();
      }
      
      const distance = Math.abs(deltaX);
      const direction = deltaX > 0 ? 'right' : 'left';
      
      setGestureState(prev => ({
        ...prev,
        swipeDirection: direction,
        swipeDistance: distance,
        swipeVelocity: 0
      }));
    }
    
    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStartRef.current || !touchCurrentRef.current) return;

    const deltaX = touchCurrentRef.current.x - touchStartRef.current.x;
    const deltaY = touchCurrentRef.current.y - touchStartRef.current.y;
    const distance = Math.abs(deltaX);
    const timeDelta = Date.now() - touchStartRef.current.time;
    const velocity = distance / timeDelta;

    // Only trigger if it's a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && distance > threshold && velocity > velocityThreshold) {
      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setGestureState({
      isSwipeActive: false,
      swipeDirection: null,
      swipeDistance: 0,
      swipeVelocity: velocity
    });

    touchStartRef.current = null;
    touchCurrentRef.current = null;
  };

  const bindGesture = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: {
      touchAction: preventScroll ? 'pan-y' : 'auto'
    }
  };

  return {
    ...gestureState,
    bindGesture
  };
};