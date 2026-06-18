import axios from 'axios';

// In-memory cache for API responses
const apiCache = new Map<string, any>();

export const api = {
  async get<T>(url: string, config?: any): Promise<T> {
    const cacheKey = url + (config ? JSON.stringify(config) : '');
    if (apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }
    const response = await axios.get<T>(url, config);
    apiCache.set(cacheKey, response.data);
    return response.data;
  },
  
  clearCache() {
    apiCache.clear();
  }
};
