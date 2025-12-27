/**
 * Auth Service
 * Handles user authentication and authorization
 */

const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

class AuthService {
    constructor() {
        this.users = new Map();
        this.preferences = new Map();
        this.userId = 1;
    }

    /**
     * Register a new user
     */
    async register({ email, password, name }) {
        // Check if email already exists
        for (const user of this.users.values()) {
            if (user.email === email) {
                throw new Error('Email already registered');
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: this.userId++,
            email,
            password_hash: passwordHash,
            name: name || email.split('@')[0],
            subscription_tier: 'free',
            email_verified: false,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        this.users.set(user.id, user);

        // Create default preferences
        this.preferences.set(user.id, {
            user_id: user.id,
            watched_platforms: [],
            alert_frequency: 'instant',
            email_notifications: true,
            created_at: new Date().toISOString()
        });

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            subscription_tier: user.subscription_tier
        });

        logger.info(`User registered: ${email}`);

        return {
            user: this.sanitizeUser(user),
            token
        };
    }

    /**
     * Login user
     */
    async login({ email, password }) {
        // Find user
        let user = null;
        for (const u of this.users.values()) {
            if (u.email === email) {
                user = u;
                break;
            }
        }

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        user.last_login = new Date().toISOString();

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            subscription_tier: user.subscription_tier
        });

        logger.info(`User logged in: ${email}`);

        return {
            user: this.sanitizeUser(user),
            token
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(id) {
        const user = this.users.get(id);
        return user ? this.sanitizeUser(user) : null;
    }

    /**
     * Update user
     */
    async updateUser(id, updates) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        // Update allowed fields
        if (updates.name) user.name = updates.name;
        if (updates.email) user.email = updates.email;

        return this.sanitizeUser(user);
    }

    /**
     * Refresh token
     */
    async refreshToken(userId) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return generateToken({
            id: user.id,
            email: user.email,
            subscription_tier: user.subscription_tier
        });
    }

    /**
     * Get user preferences
     */
    async getUserPreferences(userId) {
        return this.preferences.get(userId) || {
            user_id: userId,
            watched_platforms: [],
            alert_frequency: 'instant',
            email_notifications: true
        };
    }

    /**
     * Update preferences
     */
    async updatePreferences(userId, updates) {
        let prefs = this.preferences.get(userId);

        if (!prefs) {
            prefs = {
                user_id: userId,
                watched_platforms: [],
                alert_frequency: 'instant',
                email_notifications: true,
                created_at: new Date().toISOString()
            };
        }

        // Update allowed fields
        if (updates.watched_platforms) {
            prefs.watched_platforms = updates.watched_platforms;
        }
        if (updates.alert_frequency) {
            prefs.alert_frequency = updates.alert_frequency;
        }
        if (updates.email_notifications !== undefined) {
            prefs.email_notifications = updates.email_notifications;
        }

        this.preferences.set(userId, prefs);
        return prefs;
    }

    /**
     * Remove sensitive fields from user object
     */
    sanitizeUser(user) {
        const { password_hash, ...safe } = user;
        return safe;
    }

    /**
     * Create demo user for testing
     */
    async createDemoUser() {
        try {
            return await this.register({
                email: 'demo@digitaloligopoly.app',
                password: 'demo123456',
                name: 'Demo User'
            });
        } catch (error) {
            if (error.message === 'Email already registered') {
                return this.login({
                    email: 'demo@digitaloligopoly.app',
                    password: 'demo123456'
                });
            }
            throw error;
        }
    }
}

module.exports = new AuthService();
