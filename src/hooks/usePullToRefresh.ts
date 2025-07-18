import { useRef, useState, useEffect } from 'react';
import { VoiceHaptics } from '../utils/haptic';

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
}

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  disabled?: boolean;
}

export const usePullToRefresh = (options: PullToRefreshOptions) => {
  const {
    onRefresh,
    threshold = 80,
    resistance = 2.5,
    disabled = false
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    canRefresh: false
  });

  const touchStartRef = useRef<{ y: number; time: number } | null>(null);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || state.isRefreshing) return;

    const touch = e.touches[0];
    const scrollElement = scrollElementRef.current;
    
    // Only start pull-to-refresh if at the top of the scroll
    if (scrollElement && scrollElement.scrollTop === 0) {
      touchStartRef.current = {
        y: touch.clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || state.isRefreshing || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Only process downward pulls
    if (deltaY > 0) {
      const scrollElement = scrollElementRef.current;
      
      // Prevent default scroll behavior when pulling
      if (scrollElement && scrollElement.scrollTop === 0) {
        e.preventDefault();
        
        // Apply resistance to the pull
        const pullDistance = Math.min(deltaY / resistance, threshold * 1.5);
        const canRefresh = pullDistance >= threshold;
        
        setState(prev => ({
          ...prev,
          isPulling: true,
          pullDistance,
          canRefresh
        }));
        
        // Provide haptic feedback when reaching threshold
        if (canRefresh && !state.canRefresh) {
          VoiceHaptics.swipeGesture();
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || state.isRefreshing || !touchStartRef.current) return;

    const { canRefresh } = state;
    
    if (canRefresh) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: 0
      }));
      
      VoiceHaptics.commandProcessed();
      
      try {
        await onRefresh();
      } finally {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          canRefresh: false
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false
      }));
    }
    
    touchStartRef.current = null;
  };

  const bindPullToRefresh = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    ref: (element: HTMLElement | null) => {
      scrollElementRef.current = element;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      touchStartRef.current = null;
      scrollElementRef.current = null;
    };
  }, []);

  return {
    ...state,
    bindPullToRefresh,
    progressPercentage: Math.min((state.pullDistance / threshold) * 100, 100)
  };
};