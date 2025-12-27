const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../../utils/validators');
const AuthService = require('../../services/AuthService');
const { authenticate } = require('../../middleware/auth');

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register',
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    validate,
    async (req, res, next) => {
        try {
            const { email, password, name } = req.body;

            const result = await AuthService.register({ email, password, name });

            res.status(201).json({
                message: 'Registration successful',
                user: result.user,
                token: result.token
            });
        } catch (error) {
            if (error.message === 'Email already registered') {
                return res.status(400).json({ error: error.message });
            }
            next(error);
        }
    }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login',
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
    async (req, res, next) => {
        try {
            const { email, password } = req.body;

            const result = await AuthService.login({ email, password });

            res.json({
                message: 'Login successful',
                user: result.user,
                token: result.token
            });
        } catch (error) {
            if (error.message === 'Invalid credentials') {
                return res.status(401).json({ error: error.message });
            }
            next(error);
        }
    }
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me',
    authenticate,
    async (req, res, next) => {
        try {
            const user = await AuthService.getUserById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/auth/me
 * Update current user
 */
router.patch('/me',
    authenticate,
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    validate,
    async (req, res, next) => {
        try {
            const updates = req.body;
            const user = await AuthService.updateUser(req.user.id, updates);

            res.json({ user });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout',
    authenticate,
    async (req, res) => {
        // JWT is stateless, so we just confirm logout
        // Client should remove token
        res.json({ message: 'Logout successful' });
    }
);

/**
 * POST /api/auth/refresh
 * Refresh token
 */
router.post('/refresh',
    authenticate,
    async (req, res, next) => {
        try {
            const token = await AuthService.refreshToken(req.user.id);
            res.json({ token });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/auth/preferences
 * Get user preferences
 */
router.get('/preferences',
    authenticate,
    async (req, res, next) => {
        try {
            const preferences = await AuthService.getUserPreferences(req.user.id);
            res.json(preferences);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/auth/preferences
 * Update user preferences
 */
router.patch('/preferences',
    authenticate,
    async (req, res, next) => {
        try {
            const preferences = await AuthService.updatePreferences(req.user.id, req.body);
            res.json(preferences);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
