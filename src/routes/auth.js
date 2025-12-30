/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const db = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password (min 6 characters)
 *               role:
 *                 type: string
 *                 enum: [waitstaff, kitchen, admin]
 *                 default: waitstaff
 *               phone:
 *                 type: string
 *                 description: Phone number
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Register
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const { name, email, password, role, phone } = req.body;

      // Check if user exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      if (existingUser.rows.length > 0) {
        throw new AppError('Email already registered', 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.query(
        `INSERT INTO users (name, email, password_hash, role, phone)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
        [name, email, passwordHash, role || 'waitstaff', phone]
      );

      const user = result.rows[0];
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        success: true,
        data: { user, token, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const { email, password } = req.body;

      // Find user
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        throw new AppError('Invalid credentials', 401);
      }

      const user = result.rows[0];

      // Check password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
      }

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        success: true,
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          token,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *       400:
 *         description: Refresh token required
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user (discard tokens)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    const { verifyRefreshToken } = require('../config/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 401);
    }

    const user = result.rows[0];
    const token = generateToken(user);

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    next(error);
  }
});

// Logout (client-side should discard tokens)
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
