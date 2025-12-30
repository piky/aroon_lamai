/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: Restaurant table management
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const db = require('../config/database');
const QRCode = require('qrcode');

const router = express.Router();

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all tables
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tables with active order counts
 */

/**
 * @swagger
 * /tables/{id}:
 *   get:
 *     summary: Get single table
 *     tags: [Tables]
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
 *         description: Table details
 *       404:
 *         description: Table not found
 */

/**
 * @swagger
 * /tables:
 *   post:
 *     summary: Create a new table (admin only)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - table_number
 *               - capacity
 *             properties:
 *               table_number:
 *                 type: string
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Table created with QR code
 *       409:
 *         description: Table number already exists
 */

/**
 * @swagger
 * /tables/{id}:
 *   put:
 *     summary: Update a table (admin only)
 *     tags: [Tables]
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
 *         description: Table updated
 *       404:
 *         description: Table not found
 */

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     summary: Delete a table (admin only) - soft delete
 *     tags: [Tables]
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
 *         description: Table deleted
 *       404:
 *         description: Table not found
 */

/**
 * @swagger
 * /tables/{id}/qr:
 *   get:
 *     summary: Get table QR code
 *     tags: [Tables]
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
 *         description: QR code URL
 */

// Get all tables
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM orders WHERE table_id = t.id AND status NOT IN ('completed', 'cancelled')) as active_orders
       FROM tables t
       WHERE t.is_active = true
       ORDER BY t.table_number`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Get single table
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM tables WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Table not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Create table (admin only)
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('table_number').trim().notEmpty().withMessage('Table number is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const { table_number, capacity } = req.body;

      // Generate QR code URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const qrUrl = `${baseUrl}/order/${table_number.toLowerCase()}`;
      const qrCodeUrl = await QRCode.toDataURL(qrUrl);

      const result = await db.query(
        `INSERT INTO tables (table_number, capacity, qr_code_url)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [table_number, capacity, qrCodeUrl]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      if (error.code === '23505') {
        return next(new AppError('Table number already exists', 409));
      }
      next(error);
    }
  }
);

// Update table (admin only)
router.put('/:id',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { table_number, capacity, is_active } = req.body;

      const result = await db.query(
        `UPDATE tables 
         SET table_number = COALESCE($2, table_number),
             capacity = COALESCE($3, capacity),
             is_active = COALESCE($4, is_active)
         WHERE id = $1
         RETURNING *`,
        [id, table_number, capacity, is_active]
      );

      if (result.rows.length === 0) {
        throw new AppError('Table not found', 404);
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete table (admin only)
router.delete('/:id',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Soft delete - just mark as inactive
      const result = await db.query(
        'UPDATE tables SET is_active = false WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Table not found', 404);
      }

      res.json({
        success: true,
        message: 'Table deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get table QR code
router.get('/:id/qr', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT table_number, qr_code_url FROM tables WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Table not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
