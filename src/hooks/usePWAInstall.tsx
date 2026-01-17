import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
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

// Global storage for the deferred prompt - persists across component lifecycles
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let promptCapturedAt: number | null = null;

// Capture the event globally BEFORE React even loads
if (typeof window !== 'undefined') {
  const capturePrompt = (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptCapturedAt = Date.now();
    console.log('[PWA] 🎯 beforeinstallprompt captured globally at', new Date().toISOString());
    
    // Dispatch custom event to notify React components
    window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  };
  
  window.addEventListener('beforeinstallprompt', capturePrompt);
  
  // Also listen for app installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] ✅ App installed event fired');
    globalDeferredPrompt = null;
    promptCapturedAt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

// Utility function to check if prompt is available
export const isPWAPromptAvailable = () => !!globalDeferredPrompt;

// Utility function to trigger install directly (for use outside React)
export const triggerPWAInstall = async (): Promise<boolean> => {
  if (!globalDeferredPrompt) {
    console.log('[PWA] ❌ No prompt available for installation');
    return false;
  }
  
  try {
    console.log('[PWA] 🚀 Triggering install prompt...');
    await globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);
    
    if (outcome === 'accepted') {
      globalDeferredPrompt = null;
      promptCapturedAt = null;
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Install error:', error);
    return false;
  }
};

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
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
        || (window.navigator as any).standalone === true;
      setIsStandalone(standaloneMode);
      setIsInstalled(standaloneMode);
    };
    
    checkStandalone();

    // Listen for display mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleStandaloneChange = () => checkStandalone();
    standaloneQuery.addEventListener('change', handleStandaloneChange);

    // Sync with global prompt
    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    // Listen for prompt availability
    const handlePromptAvailable = () => {
      console.log('[PWA] React notified of prompt availability');
      setDeferredPrompt(globalDeferredPrompt);
    };

    // Listen for installation
    const handleInstalled = () => {
      console.log('[PWA] React notified of installation');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    // Also listen for native events
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA] beforeinstallprompt captured in React effect');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] appinstalled event in React effect');
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      standaloneQuery.removeEventListener('change', handleStandaloneChange);
    };
  }, [deferredPrompt]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    
    if (!prompt) {
      console.log('[PWA] ❌ No install prompt available');
      console.log('[PWA] Prompt captured at:', promptCapturedAt ? new Date(promptCapturedAt).toISOString() : 'never');
      return false;
    }

    try {
      console.log('[PWA] 🚀 Calling prompt()...');
      await prompt.prompt();
      
      console.log('[PWA] ⏳ Waiting for user choice...');
      const { outcome } = await prompt.userChoice;
      
      console.log('[PWA] User choice:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        promptCapturedAt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const clearPrompt = useCallback(() => {
    setDeferredPrompt(null);
    globalDeferredPrompt = null;
    promptCapturedAt = null;
  }, []);

  const value: PWAInstallContextType = {
    deferredPrompt,
    isInstallable: !!deferredPrompt || !!globalDeferredPrompt,
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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
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
      || (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);
    setIsInstalled(standaloneMode);

    // Sync with global prompt immediately
    if (globalDeferredPrompt) {
      console.log('[PWA Standalone] Found existing global prompt');
      setDeferredPrompt(globalDeferredPrompt);
    }

    const handlePromptAvailable = () => {
      console.log('[PWA Standalone] Prompt became available');
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA Standalone] beforeinstallprompt captured');
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    // Listen for display mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    standaloneQuery.addEventListener('change', () => {
      const newStandalone = standaloneQuery.matches;
      setIsStandalone(newStandalone);
      setIsInstalled(newStandalone);
    });

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    
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
        globalDeferredPrompt = null;
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
    isInstallable: !!deferredPrompt || !!globalDeferredPrompt,
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
