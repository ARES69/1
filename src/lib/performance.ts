/**
 * Performance Optimizations — utilities for improving application performance.
 * Includes caching, lazy loading, virtualization, and memoization helpers.
 */

/* ─── LRU Cache ─── */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/* ─── Debounce ─── */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/* ─── Throttle ─── */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/* ─── Memoize ─── */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  } as T;
}

/* ─── Virtual Scroll Helper ─── */
export interface VirtualScrollConfig {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  offset: number;
  visibleItems: number[];
}

export function calculateVirtualScroll(
  scrollTop: number,
  config: VirtualScrollConfig
): VirtualScrollState {
  const { itemCount, itemHeight, containerHeight, overscan = 5 } = config;

  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems + overscan, itemCount - 1);
  const adjustedStartIndex = Math.max(0, startIndex - overscan);
  const offset = adjustedStartIndex * itemHeight;

  const visibleItemsArray = Array.from(
    { length: endIndex - adjustedStartIndex + 1 },
    (_, i) => adjustedStartIndex + i
  );

  return {
    startIndex: adjustedStartIndex,
    endIndex,
    offset,
    visibleItems: visibleItemsArray,
  };
}

/* ─── Request Idle Callback Polyfill ─── */
export function requestIdleCallback(callback: () => void): number {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback);
  }
  // Fallback for browsers that don't support requestIdleCallback
  return setTimeout(() => callback(), 1) as unknown as number;
}

export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/* ─── Batch Updates ─── */
export class BatchUpdateQueue<T> {
  private queue: T[] = [];
  private callback: (items: T[]) => void;
  private timeout: number | null = null;
  private delay: number;

  constructor(callback: (items: T[]) => void, delay: number = 16) {
    this.callback = callback;
    this.delay = delay;
  }

  push(item: T): void {
    this.queue.push(item);
    
    if (this.timeout === null) {
      this.timeout = setTimeout(() => {
        this.flush();
      }, this.delay);
    }
  }

  flush(): void {
    if (this.queue.length > 0) {
      this.callback([...this.queue]);
      this.queue = [];
    }
    
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  clear(): void {
    this.queue = [];
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

/* ─── Image Optimization ─── */
export function optimizeImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/* ─── Web Worker Helper ─── */
export function createWorkerFromFunction(fn: Function): Worker {
  const blob = new Blob([
    `self.onmessage = async function(e) {
      const fn = ${fn.toString()};
      const result = await fn(e.data);
      self.postMessage(result);
    }`
  ], { type: 'application/javascript' });

  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);

  // Clean up URL after worker is created
  URL.revokeObjectURL(url);

  return worker;
}

/* ─── Performance Metrics ─── */
export interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  } | null;
  loadTime: number;
}

export function getPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    fps: 0,
    memory: null,
    loadTime: 0,
  };

  // Calculate FPS
  let lastTime = performance.now();
  let frames = 0;

  const measureFPS = () => {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
      frames = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(measureFPS);
  };

  requestAnimationFrame(measureFPS);

  // Memory usage (Chrome only)
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    metrics.memory = {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
    };
  }

  // Load time
  if (performance.timing) {
    metrics.loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
  }

  return metrics;
}

/* ─── Lazy Load Observer ─── */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

/* ─── Prefetch Helper ─── */
export function prefetchResource(url: string, as: 'document' | 'fetch' | 'style' | 'script' = 'fetch'): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
}

/* ─── Preconnect Helper ─── */
export function preconnectTo(url: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  document.head.appendChild(link);
}
