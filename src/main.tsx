import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initResponsiveOptimizations } from "./utils/responsiveOptimization";

// Surface runtime crashes in console (helps diagnose white screens)
window.addEventListener('error', (e) => {
  console.error('[Runtime] window.error', e.error || e.message, e);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Runtime] unhandledrejection', e.reason, e);
});

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
  const runServiceWorkerBootstrap = async () => {
    try {
      // Emergency kill-switch for white-screen / cache issues.
      // Usage: https://djassa.tech/?disableSW=1 (also works with #disableSW)
      // This does NOT affect the app design/features; it only disables SW caching.
      const url = new URL(window.location.href);
      const disableSW =
        url.searchParams.get('disableSW') === '1' ||
        url.hash.includes('disableSW') ||
        localStorage.getItem('djassa:disable_sw') === '1';

      // Avoid letting a buggy/stale SW break Lovable preview/staging.
      // Keep SW enabled on your real domains only.
      const host = window.location.hostname;
      const isProductionHost = host === 'djassa.tech' || host === 'www.djassa.tech';

      if (disableSW || !isProductionHost) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));

        // Also clear Cache Storage on preview/staging to avoid stale chunks causing blank screens.
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }

        console.log('[PWA] Service Worker disabled + caches cleared (kill-switch or non-production host)');

        // Persist disable when explicitly requested via URL.
        if (disableSW) {
          localStorage.setItem('djassa:disable_sw', '1');
        }
        return;
      }

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
        updateViaCache: 'none',
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
  };

  // Run ASAP (helps recover when a stale SW cached bad chunks)
  void runServiceWorkerBootstrap();
  // Also run after load for browsers that delay SW APIs until full load
  window.addEventListener('load', () => void runServiceWorkerBootstrap());
}

createRoot(document.getElementById("root")!).render(<App />);
