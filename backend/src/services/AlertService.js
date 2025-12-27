/**
 * Alert Service
 * Manages platform alerts and notifications
 */

const PlatformService = require('./PlatformService');
const logger = require('../utils/logger');

class AlertService {
    constructor() {
        this.alerts = [];
        this.alertId = 1;
    }

    /**
     * Create a new alert
     */
    async createAlert(data) {
        const alert = {
            id: this.alertId++,
            platform_id: data.platform_id,
            alert_type: data.type,
            severity: data.severity || 'medium',
            title: data.title,
            description: data.description,
            trigger_value: data.trigger_value,
            source: data.source,
            source_url: data.source_url,
            is_read: false,
            created_at: new Date().toISOString()
        };

        this.alerts.unshift(alert);

        // Broadcast to WebSocket clients
        if (global.broadcast) {
            global.broadcast({
                type: 'alert',
                alert
            });
        }

        logger.info(`Alert created: ${alert.title}`);
        return alert;
    }

    /**
     * Get alerts with filtering
     */
    async getAlerts(filters = {}) {
        let filtered = [...this.alerts];

        if (filters.platformId) {
            filtered = filtered.filter(a => a.platform_id === filters.platformId);
        }

        if (filters.type) {
            filtered = filtered.filter(a => a.alert_type === filters.type);
        }

        if (filters.severity) {
            filtered = filtered.filter(a => a.severity === filters.severity);
        }

        if (filters.isRead !== undefined) {
            filtered = filtered.filter(a => a.is_read === filters.isRead);
        }

        const offset = filters.offset || 0;
        const limit = filters.limit || 50;

        return {
            alerts: filtered.slice(offset, offset + limit),
            total: filtered.length,
            offset,
            limit
        };
    }

    /**
     * Get unread count
     */
    async getUnreadCount() {
        return this.alerts.filter(a => !a.is_read).length;
    }

    /**
     * Get alert by ID
     */
    async getAlertById(id) {
        return this.alerts.find(a => a.id === id) || null;
    }

    /**
     * Mark alert as read
     */
    async markAsRead(id) {
        const alert = this.alerts.find(a => a.id === id);
        if (alert) {
            alert.is_read = true;
        }
        return alert;
    }

    /**
     * Mark all alerts as read
     */
    async markAllAsRead() {
        let count = 0;
        for (const alert of this.alerts) {
            if (!alert.is_read) {
                alert.is_read = true;
                count++;
            }
        }
        return count;
    }

    /**
     * Delete alert
     */
    async deleteAlert(id) {
        const index = this.alerts.findIndex(a => a.id === id);
        if (index !== -1) {
            this.alerts.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Get alerts by platform slug
     */
    async getAlertsByPlatform(slug, limit = 20) {
        const platform = await PlatformService.getPlatformBySlug(slug);
        if (!platform) return [];

        return this.alerts
            .filter(a => a.platform_id === platform.id)
            .slice(0, limit);
    }

    /**
     * Get recent alerts
     */
    async getRecentAlerts(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        return this.alerts.filter(a =>
            new Date(a.created_at) > cutoff
        );
    }

    /**
     * Check for anomalies and create alerts
     */
    async checkForAnomalies(platformId, metricType, value, threshold) {
        if (Math.abs(value) > threshold) {
            const platform = await PlatformService.getPlatformById(platformId);

            await this.createAlert({
                platform_id: platformId,
                type: 'anomaly',
                severity: Math.abs(value) > threshold * 2 ? 'high' : 'medium',
                title: `Anomaly detected in ${metricType}`,
                description: `${platform?.name || 'Platform'} ${metricType} has unusual value: ${value}`,
                trigger_value: { value, threshold, metricType }
            });
        }
    }

    /**
     * Create price change alert
     */
    async createPriceAlert(platformId, symbol, change, price) {
        if (Math.abs(change) >= 5) {
            const platform = await PlatformService.getPlatformById(platformId);
            const direction = change > 0 ? 'up' : 'down';

            await this.createAlert({
                platform_id: platformId,
                type: 'price_change',
                severity: Math.abs(change) >= 10 ? 'high' : 'medium',
                title: `${symbol} ${direction} ${Math.abs(change).toFixed(1)}%`,
                description: `${platform?.name || symbol} stock is ${direction} ${Math.abs(change).toFixed(2)}% to $${price.toFixed(2)}`,
                trigger_value: { symbol, change, price }
            });
        }
    }

    /**
     * Generate sample alerts for demo
     */
    async generateSampleAlerts() {
        const samples = [
            {
                platform_id: 1,
                type: 'price_change',
                severity: 'medium',
                title: 'GOOGL up 3.2%',
                description: 'Alphabet stock increased following positive earnings report'
            },
            {
                platform_id: 5,
                type: 'trend_shift',
                severity: 'high',
                title: 'ChatGPT trending on social media',
                description: 'Significant increase in mentions across Reddit and HackerNews'
            },
            {
                platform_id: 3,
                type: 'news',
                severity: 'low',
                title: 'Meta announces new AI features',
                description: 'New AI-powered features coming to Facebook and Instagram'
            },
            {
                platform_id: 8,
                type: 'risk_warning',
                severity: 'high',
                title: 'TikTok regulatory concerns',
                description: 'New regulatory discussions may impact platform operations'
            }
        ];

        for (const sample of samples) {
            await this.createAlert(sample);
        }

        return this.alerts.length;
    }
}

module.exports = new AlertService();
