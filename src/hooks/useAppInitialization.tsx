import { useState, useEffect } from "react";

interface AppInitState {
  isReady: boolean;
  showSplash: boolean;
}

/**
 * Hook to manage app initialization and splash screen
 */
export const useAppInitialization = () => {
  const [state, setState] = useState<AppInitState>({
    isReady: false,
    showSplash: true,
  });

  useEffect(() => {
    // Check if this is the first visit in this session
    const hasSeenSplash = sessionStorage.getItem("djassa_splash_shown");

    if (hasSeenSplash) {
      // Skip splash screen on subsequent navigation
      setState({
        isReady: true,
        showSplash: false,
      });
    } else {
      // Show splash screen on first load
      sessionStorage.setItem("djassa_splash_shown", "true");
      setState({
        isReady: false,
        showSplash: true,
      });
    }
  }, []);

  const handleSplashComplete = () => {
    setState({
      isReady: true,
      showSplash: false,
    });
  };

  return {
    ...state,
    handleSplashComplete,
  };
};
