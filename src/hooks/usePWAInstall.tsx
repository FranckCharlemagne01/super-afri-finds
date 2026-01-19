import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isSafari: boolean;
  isChrome: boolean;
  promptInstall: () => Promise<boolean>;
  clearPrompt: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

// Utility function to get global prompt from main.tsx
const getGlobalPrompt = (): BeforeInstallPromptEvent | null => {
  if (typeof window !== 'undefined') {
    return (window as any).__PWA_DEFERRED_PROMPT || null;
  }
  return null;
};

// Utility function to check if installed
const getIsInstalled = (): boolean => {
  if (typeof window !== 'undefined') {
    return (window as any).__PWA_IS_INSTALLED || false;
  }
  return false;
};

// Utility function to check if prompt is available
export const isPWAPromptAvailable = () => !!getGlobalPrompt();

// Utility function to trigger install directly (for use outside React)
export const triggerPWAInstall = async (): Promise<boolean> => {
  const prompt = getGlobalPrompt();
  
  if (!prompt) {
    console.log('[PWA] ❌ No prompt available for installation');
    return false;
  }
  
  try {
    console.log('[PWA] 🚀 Triggering install prompt...');
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    console.log('[PWA] User choice:', outcome);
    
    if (outcome === 'accepted') {
      (window as any).__PWA_DEFERRED_PROMPT = null;
      (window as any).__PWA_IS_INSTALLED = true;
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Install error:', error);
    return false;
  }
};

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(getGlobalPrompt());
  const [isInstalled, setIsInstalled] = useState(getIsInstalled());
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChromeBrowser = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);
    const isDesktopDevice = !isIOSDevice && !isAndroidDevice;
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsDesktop(isDesktopDevice);
    setIsSafari(isSafariBrowser);
    setIsChrome(isChromeBrowser);
    
    // Check if already installed (standalone mode)
    const checkStandalone = () => {
      const standaloneMode = window.matchMedia('(display-mode: standalone)').matches 
        || window.matchMedia('(display-mode: fullscreen)').matches
        || (window.navigator as any).standalone === true
        || document.referrer.includes('android-app://');
      setIsStandalone(standaloneMode);
      if (standaloneMode) {
        setIsInstalled(true);
        (window as any).__PWA_IS_INSTALLED = true;
      }
    };
    
    checkStandalone();

    // Listen for display mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleStandaloneChange = () => checkStandalone();
    standaloneQuery.addEventListener('change', handleStandaloneChange);

    // Sync with global prompt
    const globalPrompt = getGlobalPrompt();
    if (globalPrompt && !deferredPrompt) {
      setDeferredPrompt(globalPrompt);
    }

    // Listen for prompt availability from main.tsx
    const handlePromptAvailable = (e: Event) => {
      const customEvent = e as CustomEvent<BeforeInstallPromptEvent>;
      console.log('[PWA Provider] Prompt became available');
      setDeferredPrompt(customEvent.detail || getGlobalPrompt());
    };

    // Listen for installation
    const handleInstalled = () => {
      console.log('[PWA Provider] App installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('pwa-install-available', handlePromptAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handlePromptAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      standaloneQuery.removeEventListener('change', handleStandaloneChange);
    };
  }, [deferredPrompt]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPrompt || getGlobalPrompt();
    
    if (!prompt) {
      console.log('[PWA Provider] ❌ No install prompt available');
      return false;
    }

    try {
      console.log('[PWA Provider] 🚀 Calling prompt()...');
      await prompt.prompt();
      
      console.log('[PWA Provider] ⏳ Waiting for user choice...');
      const { outcome } = await prompt.userChoice;
      
      console.log('[PWA Provider] User choice:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        (window as any).__PWA_DEFERRED_PROMPT = null;
        (window as any).__PWA_IS_INSTALLED = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA Provider] Install prompt error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const clearPrompt = useCallback(() => {
    setDeferredPrompt(null);
    (window as any).__PWA_DEFERRED_PROMPT = null;
  }, []);

  const value: PWAInstallContextType = {
    deferredPrompt,
    isInstallable: !!deferredPrompt || !!getGlobalPrompt(),
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    isDesktop,
    isSafari,
    isChrome,
    promptInstall,
    clearPrompt,
  };

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstall = (): PWAInstallContextType => {
  const context = useContext(PWAInstallContext);
  
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  
  return context;
};

// Standalone hook for components outside provider - IMPROVED VERSION
export const usePWAInstallStandalone = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(getGlobalPrompt());
  const [isInstalled, setIsInstalled] = useState(getIsInstalled());
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSOverlay, setShowIOSOverlay] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const androidDevice = /android/.test(userAgent);
    
    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);
    
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || window.matchMedia('(display-mode: fullscreen)').matches
      || (window.navigator as any).standalone === true
      || document.referrer.includes('android-app://');
    setIsStandalone(standaloneMode);
    if (standaloneMode) {
      setIsInstalled(true);
    }

    // Sync with global prompt immediately
    const globalPrompt = getGlobalPrompt();
    if (globalPrompt) {
      console.log('[PWA Standalone] Found existing global prompt');
      setDeferredPrompt(globalPrompt);
    }

    const handlePromptAvailable = (e: Event) => {
      const customEvent = e as CustomEvent<BeforeInstallPromptEvent>;
      console.log('[PWA Standalone] Prompt became available');
      setDeferredPrompt(customEvent.detail || getGlobalPrompt());
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('pwa-install-available', handlePromptAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    // Listen for display mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleStandaloneChange = () => {
      const newStandalone = standaloneQuery.matches;
      setIsStandalone(newStandalone);
      if (newStandalone) {
        setIsInstalled(true);
      }
    };
    standaloneQuery.addEventListener('change', handleStandaloneChange);

    return () => {
      window.removeEventListener('pwa-install-available', handlePromptAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      standaloneQuery.removeEventListener('change', handleStandaloneChange);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    const prompt = deferredPrompt || getGlobalPrompt();
    
    if (!prompt) {
      console.log('[PWA Standalone] ❌ No prompt available');
      return false;
    }

    try {
      console.log('[PWA Standalone] 🚀 Triggering prompt...');
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      
      console.log('[PWA Standalone] User choice:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        (window as any).__PWA_DEFERRED_PROMPT = null;
        (window as any).__PWA_IS_INSTALLED = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA Standalone] Error:', error);
      return false;
    }
  };

  const openIOSOverlay = () => setShowIOSOverlay(true);
  const closeIOSOverlay = () => setShowIOSOverlay(false);

  return {
    deferredPrompt,
    isInstallable: !!deferredPrompt || !!getGlobalPrompt(),
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    promptInstall,
    showIOSOverlay,
    openIOSOverlay,
    closeIOSOverlay,
  };
};
