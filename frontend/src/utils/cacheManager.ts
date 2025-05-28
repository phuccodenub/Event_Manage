interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags: string[]; // Tags for grouping related cache items
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  prefix: string;
}

class CacheManager {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheItem>;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100, // Maximum cache items
      prefix: 'app_cache_',
      ...config
    };
    this.memoryCache = new Map();
  }

  /**
   * Generate cache key với prefix
   */
  private getCacheKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * Check if cache item is expired
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Clean up expired items từ memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, item] of Array.from(this.memoryCache.entries())) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }

    // Nếu vẫn quá nhiều items, remove oldest ones
    if (this.memoryCache.size > this.config.maxSize) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  /**
   * Set cache item
   */
  set(key: string, data: any, options: { ttl?: number; tags?: string[] } = {}): void {
    const cacheKey = this.getCacheKey(key);
    const ttl = options.ttl ?? this.config.defaultTTL;
    const tags = options.tags ?? [];

    const item: CacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
      tags
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, item);

    // Store in localStorage với error handling
    try {
      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to store cache in localStorage:', error);
    }

    // Cleanup old items
    this.cleanupMemoryCache();
  }

  /**
   * Get cache item
   */
  get(key: string): any | null {
    const cacheKey = this.getCacheKey(key);

    // Check memory cache first
    let item = this.memoryCache.get(cacheKey);

    // If not in memory, try localStorage
    if (!item) {
      try {
        const storedData = localStorage.getItem(cacheKey);
        if (storedData) {
          item = JSON.parse(storedData);
          // Store back in memory cache
          if (item) {
            this.memoryCache.set(cacheKey, item);
          }
        }
      } catch (error) {
        console.warn('Failed to read cache from localStorage:', error);
        return null;
      }
    }

    if (!item) {
      return null;
    }

    // Check if expired
    if (this.isExpired(item)) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Delete specific cache item
   */
  delete(key: string): void {
    const cacheKey = this.getCacheKey(key);
    this.memoryCache.delete(cacheKey);
    
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to remove cache from localStorage:', error);
    }
  }

  /**
   * Clear cache by tags
   */
  clearByTags(tags: string[]): void {
    // Clear from memory cache
    for (const [key, item] of Array.from(this.memoryCache.entries())) {
      if (item.tags.some((tag: string) => tags.includes(tag))) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.prefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '');
            if (item.tags && item.tags.some((tag: string) => tags.includes(tag))) {
              keysToRemove.push(key);
            }
          } catch (error) {
            // Invalid JSON, remove it
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache by tags from localStorage:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache from localStorage:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { memorySize: number; localStorageSize: number } {
    let localStorageSize = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.prefix)) {
          localStorageSize++;
        }
      }
    } catch (error) {
      console.warn('Failed to get localStorage stats:', error);
    }

    return {
      memorySize: this.memoryCache.size,
      localStorageSize
    };
  }

  /**
   * Invalidate cache for specific operations
   */
  invalidateForMutation(mutationType: 'create' | 'update' | 'delete', entityType: string): void {
    const tagsToInvalidate = [entityType, `${entityType}_list`];
    
    if (mutationType === 'create') {
      tagsToInvalidate.push('list', 'count');
    } else if (mutationType === 'update') {
      tagsToInvalidate.push('detail');
    } else if (mutationType === 'delete') {
      tagsToInvalidate.push('list', 'count', 'detail');
    }

    this.clearByTags(tagsToInvalidate);
  }
}

// Create singleton instance
const cacheManager = new CacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
  prefix: 'hutech_events_'
});

// Export cache utility functions
export const cache = {
  /**
   * Cache GET requests
   */
  cacheGetRequest: (url: string, data: any, ttl?: number): void => {
    const key = `api_${url}`;
    const tags = ['api', url.split('/')[0]];
    cacheManager.set(key, data, { ttl, tags });
  },

  /**
   * Get cached request
   */
  getCachedRequest: (url: string): any | null => {
    const key = `api_${url}`;
    return cacheManager.get(key);
  },

  /**
   * Invalidate cache after mutations
   */
  invalidateAfterMutation: (mutationType: 'create' | 'update' | 'delete', entityType: string): void => {
    cacheManager.invalidateForMutation(mutationType, entityType);
  },

  /**
   * Clear specific cache
   */
  clearCache: (key: string): void => {
    cacheManager.delete(key);
  },

  /**
   * Clear all cache
   */
  clearAllCache: (): void => {
    cacheManager.clear();
  },

  /**
   * Get cache stats
   */
  getStats: (): { memorySize: number; localStorageSize: number } => {
    return cacheManager.getStats();
  }
};

export default cacheManager; 