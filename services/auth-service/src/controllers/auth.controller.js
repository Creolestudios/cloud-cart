// ============================================================
// Auth Service — Auth Controller
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { publishEvent } = require('../config/rabbitmq');
const { blacklistToken } = require('../config/redis');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

// Generate JWT tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION, issuer: 'cloudcart-auth' }
  );

  const refreshToken = jwt.sign(
    { id: user._id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRATION, issuer: 'cloudcart-auth' }
  );

  return { accessToken, refreshToken };
};

// ── Register ──────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = new User({ email, password, firstName, lastName });
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user);

    // Publish event
    await publishEvent('user.created', {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account has been deactivated',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user);

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      message: 'Login successful',
      user: user.toJSON(),
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
};

// ── Refresh Token ─────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or inactive',
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.status(200).json({
      message: 'Token refreshed',
      ...tokens,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token has expired',
      });
    }
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Blacklist the token
      const decoded = jwt.decode(token);
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await blacklistToken(token, expiresIn);
      }
    }

    logger.info(`User logged out: ${req.user.email}`);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Get Current User ──────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// ── Update Profile ────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    await publishEvent('user.updated', { userId: user._id, firstName, lastName });

    res.status(200).json({ message: 'Profile updated', user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// ── Change Password ───────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Get All Users (Admin) ─────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Delete User (Admin) ──────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    await publishEvent('user.deleted', { userId: user._id, email: user.email });

    logger.info(`User deleted: ${user.email}`);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Validate Token (Inter-service) ───────────────────────
exports.validateToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ valid: false, message: 'Invalid or inactive user' });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
};
