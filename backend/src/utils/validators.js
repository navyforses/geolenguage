const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
}

/**
 * Custom validator for slug format
 */
function isSlug(value) {
    if (!value) return false;
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

/**
 * Custom slug validation for use with express-validator
 */
function slugValidator(value) {
    if (!isSlug(value)) {
        throw new Error('Invalid slug format');
    }
    return true;
}

module.exports = { validate, isSlug, slugValidator };
