// ============================================================
// Auth Service — Auth Routes
// ============================================================

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// ── Registration ──────────────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    validate,
  ],
  authController.register
);

// ── Login ─────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);

// ── Refresh Token ─────────────────────────────────────────
router.post('/refresh', authController.refreshToken);

// ── Logout ────────────────────────────────────────────────
router.post('/logout', authenticate, authController.logout);

// ── Get Current User ──────────────────────────────────────
router.get('/me', authenticate, authController.getMe);

// ── Update Profile ────────────────────────────────────────
router.put(
  '/me',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    validate,
  ],
  authController.updateProfile
);

// ── Change Password ───────────────────────────────────────
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain uppercase, lowercase, and number'),
    validate,
  ],
  authController.changePassword
);

// ── Admin Routes ──────────────────────────────────────────
router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);
router.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);

// ── Token Validation (for inter-service communication) ───
router.post('/validate-token', authController.validateToken);

module.exports = router;
