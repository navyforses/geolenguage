/**
 * API Service
 * Connects frontend to backend real data endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE;
    }

    /**
     * Make API request with error handling
     */
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * Get all platforms with live data
     */
    async getAllPlatforms() {
        return this.request('/platforms/live/all');
    }

    /**
     * Get dashboard summary
     */
    async getDashboard() {
        return this.request('/platforms/live/dashboard');
    }

    /**
     * Get live feed updates
     */
    async getLiveFeed(limit = 20) {
        return this.request(`/platforms/live/feed?limit=${limit}`);
    }

    /**
     * Get single platform data
     */
    async getPlatform(slug) {
        return this.request(`/platforms/live/${slug}`);
    }

    /**
     * Get historical data for a platform
     */
    async getHistory(slug, range = '1mo') {
        return this.request(`/platforms/live/${slug}/history?range=${range}`);
    }

    /**
     * Force refresh platform data
     */
    async refreshPlatform(slug) {
        return this.request(`/platforms/live/${slug}/refresh`, {
            method: 'POST'
        });
    }

    /**
     * Compare multiple platforms
     */
    async comparePlatforms(slugs) {
        return this.request('/platforms/compare', {
            method: 'POST',
            body: JSON.stringify({ slugs })
        });
    }
}

export const api = new ApiService();
export default api;
