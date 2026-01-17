import { useCallback } from 'react';

/**
 * Hook for haptic feedback on supported devices
 * Uses the Vibration API when available
 */
export const useHapticFeedback = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  /**
   * Light haptic feedback for UI interactions
   */
  const light = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(10);
    }
  }, [isSupported]);

  /**
   * Medium haptic feedback for selections
   */
  const medium = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(20);
    }
  }, [isSupported]);

  /**
   * Heavy haptic feedback for confirmations
   */
  const heavy = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(30);
    }
  }, [isSupported]);

  /**
   * Success pattern feedback
   */
  const success = useCallback(() => {
    if (isSupported) {
      navigator.vibrate([10, 50, 20]);
    }
  }, [isSupported]);

  /**
   * Error pattern feedback
   */
  const error = useCallback(() => {
    if (isSupported) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  }, [isSupported]);

  /**
   * Selection changed feedback
   */
  const selectionChanged = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(5);
    }
  }, [isSupported]);

  return {
    isSupported,
    light,
    medium,
    heavy,
    success,
    error,
    selectionChanged
  };
};
