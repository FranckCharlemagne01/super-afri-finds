import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initResponsiveOptimizations } from "./utils/responsiveOptimization";

// Initialize responsive optimizations for mobile and tablet
initResponsiveOptimizations();

// Declare global PWA types
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
    'appinstalled': Event;
  }
  interface Window {
    __PWA_DEFERRED_PROMPT: BeforeInstallPromptEvent | null;
    __PWA_IS_INSTALLED: boolean;
  }
}

// Initialize global PWA state
window.__PWA_DEFERRED_PROMPT = null;
window.__PWA_IS_INSTALLED = false;

// Check if already installed
const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true ||
  document.referrer.includes('android-app://');

if (isStandalone) {
  window.__PWA_IS_INSTALLED = true;
  console.log('[PWA] App is running in standalone mode');
}

// Capture beforeinstallprompt as early as possible (before React mounts)
// Android: NE PAS appeler preventDefault() pour permettre au navigateur d'afficher son popup natif
window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
  // Store the event for later use (for our custom button)
  window.__PWA_DEFERRED_PROMPT = e;
  
  console.log('[PWA] ✅ beforeinstallprompt captured - platforms:', e.platforms);
  console.log('[PWA] Install prompt is now available for user interaction');
  
  // Dispatch custom event for components to listen
  window.dispatchEvent(new CustomEvent('pwa-install-available', { detail: e }));
  
  // Note: We don't call e.preventDefault() here so the browser can show its native mini-infobar
  // Our custom button will also work in parallel
});

// Listen for app installed event
window.addEventListener('appinstalled', () => {
  window.__PWA_IS_INSTALLED = true;
  window.__PWA_DEFERRED_PROMPT = null;
  console.log('[PWA] App was installed successfully');
  
  // Notify components
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

// Register Service Worker for PWA with better error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister old service workers first for clean update
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        const oldVersion = registration.active?.scriptURL;
        if (oldVersion && !oldVersion.includes('sw.js')) {
          await registration.unregister();
          console.log('[PWA] Unregistered old service worker');
        }
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('[PWA] Service Worker registered successfully:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New content available, refresh to update');
            }
          });
        }
      });
      
      // Force update check
      registration.update();
      
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
