import { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';

/**
 * Unified device detection hook for Djassa
 * Detects: web | pwa | wrapper (Capacitor) | native
 * Single source of truth for all platform-specific behavior
 */

export type DevicePlatform = 'web' | 'pwa' | 'wrapper-ios' | 'wrapper-android' | 'native';
export type NetworkQuality = 'good' | 'slow' | 'offline';

export interface DeviceContext {
  /** Current platform: web, pwa, wrapper-ios, wrapper-android */
  platform: DevicePlatform;
  /** Is running as installed PWA (standalone mode) */
  isPWA: boolean;
  /** Is running inside Capacitor wrapper */
  isWrapper: boolean;
  /** Is any mobile device (phone or tablet) */
  isMobile: boolean;
  /** Is tablet sized (768-1024px) */
  isTablet: boolean;
  /** Is iOS (Safari or wrapper) */
  isIOS: boolean;
  /** Is Android */
  isAndroid: boolean;
  /** Network connectivity state */
  isOnline: boolean;
  /** Network quality estimate */
  networkQuality: NetworkQuality;
  /** App version for tracking */
  appVersion: string;
  /** Can install as PWA */
  canInstallPWA: boolean;
  /** Has notch / dynamic island */
  hasNotch: boolean;
  /** Safe area needed (for bottom nav) */
  hasSafeArea: boolean;
}

const APP_VERSION = '2.0.0';

function detectPlatform(): DevicePlatform {
  // Check Capacitor first
  const win = window as any;
  if (win.Capacitor?.isNativePlatform?.()) {
    const p = win.Capacitor.getPlatform();
    return p === 'ios' ? 'wrapper-ios' : 'wrapper-android';
  }

  // Check standalone (PWA installed)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  if (isStandalone) return 'pwa';

  return 'web';
}

function detectNetworkQuality(): NetworkQuality {
  if (!navigator.onLine) return 'offline';

  const conn = (navigator as any).connection;
  if (conn) {
    const effectiveType = conn.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g' && (conn.downlink ?? 10) < 1) return 'slow';
  }

  return 'good';
}

function detectHasNotch(): boolean {
  // Check for safe area insets (notch devices)
  const test = document.createElement('div');
  test.style.paddingTop = 'env(safe-area-inset-top)';
  document.body.appendChild(test);
  const hasNotch = getComputedStyle(test).paddingTop !== '0px';
  document.body.removeChild(test);
  return hasNotch;
}

const DeviceCtx = createContext<DeviceContext | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>(detectNetworkQuality);
  const [canInstallPWA, setCanInstallPWA] = useState(!!window.__PWA_DEFERRED_PROMPT);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setNetworkQuality(detectNetworkQuality());
    };
    const onOffline = () => {
      setIsOnline(false);
      setNetworkQuality('offline');
    };
    const onInstallAvailable = () => setCanInstallPWA(true);
    const onInstalled = () => setCanInstallPWA(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('pwa-install-available', onInstallAvailable);
    window.addEventListener('pwa-installed', onInstalled);

    // Monitor connection changes
    const conn = (navigator as any).connection;
    const onConnectionChange = () => setNetworkQuality(detectNetworkQuality());
    conn?.addEventListener?.('change', onConnectionChange);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('pwa-install-available', onInstallAvailable);
      window.removeEventListener('pwa-installed', onInstalled);
      conn?.removeEventListener?.('change', onConnectionChange);
    };
  }, []);

  const value = useMemo<DeviceContext>(() => {
    const ua = navigator.userAgent;
    const platform = detectPlatform();
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const width = window.innerWidth;
    const isMobile = width < 768 || /Mobi|Android/i.test(ua);
    const isTablet = width >= 768 && width < 1024;
    const hasNotch = isIOS && detectHasNotch();

    return {
      platform,
      isPWA: platform === 'pwa',
      isWrapper: platform === 'wrapper-ios' || platform === 'wrapper-android',
      isMobile,
      isTablet,
      isIOS,
      isAndroid,
      isOnline,
      networkQuality,
      appVersion: APP_VERSION,
      canInstallPWA,
      hasNotch,
      hasSafeArea: hasNotch || platform === 'wrapper-ios',
    };
  }, [isOnline, networkQuality, canInstallPWA]);

  return <DeviceCtx.Provider value={value}>{children}</DeviceCtx.Provider>;
}

/**
 * Hook to access unified device context
 * Must be used within DeviceProvider
 */
export function useDeviceContext(): DeviceContext {
  const ctx = useContext(DeviceCtx);
  if (!ctx) {
    // Fallback for usage outside provider (during init)
    return {
      platform: 'web',
      isPWA: false,
      isWrapper: false,
      isMobile: window.innerWidth < 768,
      isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
      isIOS: false,
      isAndroid: false,
      isOnline: navigator.onLine,
      networkQuality: 'good',
      appVersion: APP_VERSION,
      canInstallPWA: false,
      hasNotch: false,
      hasSafeArea: false,
    };
  }
  return ctx;
}
