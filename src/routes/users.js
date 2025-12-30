/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const db = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, waitstaff, kitchen]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /users/password:
 *   put:
 *     summary: Change password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated
 *       401:
 *         description: Current password incorrect
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deactivate user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deactivated
 *       404:
 *         description: User not found
 */

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { role, is_active, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND is_active = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;

    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res, next) => {
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

// Update profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3 RETURNING id, name, email, role, phone',
      [name, phone, req.user.id]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/password', authenticate, [
  body('current_password').notEmpty().withMessage('Current password required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { current_password, new_password } = req.body;

    // Get user with password
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 10);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update user (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, is_active } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($2, name),
           email = COALESCE($3, email),
           role = COALESCE($4, role),
           phone = COALESCE($5, phone),
           is_active = COALESCE($6, is_active)
       WHERE id = $1
       RETURNING id, name, email, role, phone, is_active`,
      [id, name, email, role, phone, is_active]
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

// Delete/Deactivate user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Soft delete
    const result = await db.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
