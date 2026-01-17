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

// Global variable to capture the event before React mounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Capture the event globally as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] beforeinstallprompt captured globally');
  });
}

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

    // If we captured the prompt globally before React mounted
    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    // Listen for new install prompts
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA] beforeinstallprompt event captured in React');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener('change', handleStandaloneChange);
    };
  }, [deferredPrompt]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    
    if (!prompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      console.log('[PWA] Triggering install prompt');
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      
      console.log('[PWA] User choice:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
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

// Standalone hook for components outside provider
export const usePWAInstallStandalone = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);
    setIsInstalled(standaloneMode);

    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    if (!prompt) return false;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    deferredPrompt,
    isInstallable: !!deferredPrompt || !!globalDeferredPrompt,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    promptInstall,
  };
};
