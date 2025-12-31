/**
 * Performance monitoring utilities
 * Use in development to identify slow renders
 */

/**
 * Mark performance timing
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure between two marks
 */
export function measure(name: string, startMark: string, endMark: string): void {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
    } catch (e) {
      // Ignore errors if marks don't exist
    }
  }
}

/**
 * Log performance entries
 */
export function getPerformanceEntries(type?: string): PerformanceEntry[] {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    return type ? performance.getEntriesByType(type) : performance.getEntries();
  }
  return [];
}

/**
 * Clear performance marks and measures
 */
export function clearPerformance(): void {
  if (typeof performance !== 'undefined') {
    if (performance.clearMarks) performance.clearMarks();
    if (performance.clearMeasures) performance.clearMeasures();
  }
}

/**
 * Report Web Vitals (if needed in future)
 */
export function reportWebVitals(onPerfEntry?: (entry: any) => void): void {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Web vitals can be added here if needed
  }
}

/**
 * Check if device is low-powered (for adaptive performance)
 */
export function isLowPowerDevice(): boolean {
  // Check for hardware concurrency
  const cores = navigator.hardwareConcurrency || 2;
  if (cores <= 2) return true;

  // Check device memory (if available)
  if ('deviceMemory' in navigator) {
    const memory = (navigator as any).deviceMemory;
    if (memory && memory <= 2) return true;
  }

  // Check connection (if slow)
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
      return true;
    }
  }

  return false;
}

/**
 * Get adaptive quality setting based on device capability
 */
export function getAdaptiveQuality(): 'low' | 'medium' | 'high' {
  if (isLowPowerDevice()) return 'low';
  
  const cores = navigator.hardwareConcurrency || 4;
  if (cores >= 8) return 'high';
  if (cores >= 4) return 'medium';
  
  return 'low';
}
