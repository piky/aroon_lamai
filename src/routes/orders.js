/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and kitchen display
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const db = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders with filters
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, acknowledged, preparing, ready, served, completed, cancelled]
 *       - in: query
 *         name: table
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: waiter
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get single order with items
 *     tags: [Orders]
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
 *         description: Order with items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */

// Get all orders (with filters)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, table, waiter, date_from, date_to, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        o.*, t.table_number,
        u.name as waiter_name
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.waiter_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    if (table) {
      params.push(table);
      query += ` AND o.table_id = $${params.length}`;
    }

    if (req.user.role === 'waitstaff') {
      params.push(req.user.id);
      query += ` AND o.waiter_id = $${params.length}`;
    }

    if (date_from) {
      params.push(date_from);
      query += ` AND o.created_at >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      query += ` AND o.created_at <= $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC';

    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;

    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);

    // Get order items for each order
    for (const order of result.rows) {
      const itemsResult = await db.query(
        `SELECT oi.*, m.name as item_name, m.description as item_description
         FROM order_items oi
         JOIN menu_items m ON oi.menu_item_id = m.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const orderResult = await db.query(
      `SELECT o.*, t.table_number, u.name as waiter_name
       FROM orders o
       JOIN tables t ON o.table_id = t.id
       LEFT JOIN users u ON o.waiter_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await db.query(
      `SELECT oi.*, m.name as item_name, m.description as item_description
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       WHERE oi.order_id = $1`,
      [id]
    );
    order.items = itemsResult.rows;

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// Create order
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - table_id
 *               - items
 *             properties:
 *               table_id:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - menu_item_id
 *                     - quantity
 *                   properties:
 *                     menu_item_id:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     special_instructions:
 *                       type: string
 *               special_instructions:
 *                 type: string
 *               customer_session_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Table or item not found
 */

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, acknowledged, preparing, ready, served, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Order cannot be cancelled
 */

router.post('/',
  authenticate,
  [
    body('table_id').isUUID().withMessage('Valid table ID required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.menu_item_id').isUUID().withMessage('Valid menu item ID required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const { table_id, items, special_instructions, customer_session_id } = req.body;

      // Validate table exists
      const tableResult = await db.query('SELECT id FROM tables WHERE id = $1 AND is_active = true', [table_id]);
      if (tableResult.rows.length === 0) {
        throw new AppError('Table not found', 404);
      }

      // Get menu items and calculate total
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const itemResult = await db.query(
          'SELECT id, price, name FROM menu_items WHERE id = $1 AND is_available = true',
          [item.menu_item_id]
        );

        if (itemResult.rows.length === 0) {
          throw new AppError(`Menu item not found or unavailable: ${item.menu_item_id}`, 404);
        }

        const menuItem = itemResult.rows[0];
        const itemTotal = menuItem.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: menuItem.price,
          total_price: itemTotal,
          special_instructions: item.special_instructions,
        });
      }

      const taxRate = 0.07; // 7% tax
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // Start transaction
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Create order
        const orderResult = await client.query(
          `INSERT INTO orders (table_id, waiter_id, customer_session_id, subtotal, tax_amount, total_amount, special_instructions, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
           RETURNING *`,
          [table_id, req.user.role === 'waitstaff' ? req.user.id : null, customer_session_id, subtotal, taxAmount, totalAmount, special_instructions]
        );

        const order = orderResult.rows[0];

        // Create order items
        for (const item of orderItems) {
          await client.query(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [order.id, item.menu_item_id, item.quantity, item.unit_price, item.total_price, item.special_instructions]
          );
        }

        await client.query('COMMIT');

        // Emit real-time notification
        const io = req.app.get('io');
        io.to('kitchen').emit('order:new', { orderId: order.id, tableId: table_id });

        // Return order with items
        const fullOrder = await db.query(
          `SELECT o.*, t.table_number, u.name as waiter_name
           FROM orders o
           JOIN tables t ON o.table_id = t.id
           LEFT JOIN users u ON o.waiter_id = u.id
           WHERE o.id = $1`,
          [order.id]
        );

        const items = await db.query(
          'SELECT oi.*, m.name as item_name FROM order_items oi JOIN menu_items m ON oi.menu_item_id = m.id WHERE oi.order_id = $1',
          [order.id]
        );

        res.status(201).json({
          success: true,
          data: { ...fullOrder.rows[0], items: items.rows },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }
);

// Update order status
router.patch('/:id/status',
  authenticate,
  authorize('waitstaff', 'kitchen', 'admin'),
  [
    body('status').isIn(['pending', 'acknowledged', 'preparing', 'ready', 'served', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid status', 400);
      }

      const { id } = req.params;
      const { status } = req.body;

      const result = await db.query(
        `UPDATE orders 
         SET status = $1, 
             completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Order not found', 404);
      }

      // Emit status update
      const io = req.app.get('io');
      io.emit('order:status', { orderId: id, status, tableId: result.rows[0].table_id });

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Cancel order
router.post('/:id/cancel', authenticate, authorize('waitstaff', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await db.query(
      `UPDATE orders 
       SET status = 'cancelled', 
           special_instructions = COALESCE($2, special_instructions) || ' [CANCELLED: ' || COALESCE($2, 'No reason') || ']'
       WHERE id = $1 AND status IN ('pending', 'acknowledged')
       RETURNING *`,
      [id, reason]
    );

    if (result.rows.length === 0) {
      throw new AppError('Order cannot be cancelled', 400);
    }

    // Emit cancellation
    const io = req.app.get('io');
    io.to('kitchen').emit('order:cancel', { orderId: id });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
