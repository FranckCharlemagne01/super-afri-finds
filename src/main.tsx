import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initResponsiveOptimizations } from "./utils/responsiveOptimization";

// Initialize responsive optimizations for mobile and tablet
initResponsiveOptimizations();

// Capture beforeinstallprompt as early as possible (before React mounts)
let deferredInstallPrompt: Event | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  console.log('[PWA] beforeinstallprompt captured early in main.tsx');
  // Dispatch custom event for components to listen
  window.dispatchEvent(new CustomEvent('pwa-install-available', { detail: e }));
});

// Register Service Worker for PWA with better error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[PWA] Service Worker registered successfully:', registration.scope);
      
      // Check for updates periodically
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
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });
}

// Make deferred prompt accessible globally
(window as any).__PWA_DEFERRED_PROMPT = deferredInstallPrompt;

createRoot(document.getElementById("root")!).render(<App />);
