'use client';

import { useEffect, useRef, useState } from 'react';

interface Options {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: Options) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullingRef = useRef(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 5) return;
      startY.current = e.touches[0].clientY;
      pullingRef.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current) return;
      const y = e.touches[0].clientY;
      const diff = y - startY.current;
      if (diff > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
      } else {
        setPullDistance(0);
      }
    };

    const onTouchEnd = async () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      if (pullDistance >= threshold) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setTimeout(() => {
            setRefreshing(false);
            setPullDistance(0);
          }, 400);
        }
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, threshold, pullDistance]);

  return { pullDistance, refreshing, threshold };
}