const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const db = require('../config/database');

const router = express.Router();

// Get bill for order
router.get('/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const orderResult = await db.query(
      `SELECT o.*, t.table_number 
       FROM orders o 
       JOIN tables t ON o.table_id = t.id 
       WHERE o.id = $1`,
      [orderId]
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
      [orderId]
    );

    const servedItems = itemsResult.rows.filter(item => item.status === 'served');
    const pendingItems = itemsResult.rows.filter(item => item.status !== 'served');

    // Calculate bill for served items
    const subtotal = servedItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    const taxRate = 0.07;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    res.json({
      success: true,
      data: {
        order_id: orderId,
        table_number: order.table_number,
        items: servedItems,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        pending_items_count: pendingItems.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get bill by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM bills WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Bill not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Create bill (after order completed)
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('order_id').isUUID().withMessage('Valid order ID required'),
  ],
  async (req, res, next) => {
    try {
      const { order_id, tip_amount = 0, discount_amount = 0 } = req.body;

      // Get order
      const orderResult = await db.query(
        `SELECT o.*, t.table_number 
         FROM orders o 
         JOIN tables t ON o.table_id = t.id 
         WHERE o.id = $1`,
        [order_id]
      );

      if (orderResult.rows.length === 0) {
        throw new AppError('Order not found', 404);
      }

      const order = orderResult.rows[0];

      // Get served items
      const itemsResult = await db.query(
        `SELECT oi.* FROM order_items oi WHERE oi.order_id = $1 AND oi.status = 'served'`,
        [order_id]
      );

      const subtotal = itemsResult.rows.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
      const taxAmount = subtotal * 0.07;
      const totalAmount = subtotal + taxAmount + parseFloat(tip_amount) - parseFloat(discount_amount);

      const result = await db.query(
        `INSERT INTO bills (order_id, subtotal, tax_amount, tip_amount, discount_amount, total_amount, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [order_id, subtotal, taxAmount, tip_amount, discount_amount, totalAmount]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark bill as paid
router.patch('/:id/pay',
  authenticate,
  authorize('admin', 'waitstaff'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { payment_method, payment_reference } = req.body;

      const result = await db.query(
        `UPDATE bills 
         SET payment_status = 'completed',
             payment_method = $2,
             payment_reference = $3,
             paid_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND payment_status = 'pending'
         RETURNING *`,
        [id, payment_method, payment_reference]
      );

      if (result.rows.length === 0) {
        throw new AppError('Bill not found or already paid', 400);
      }

      // Mark order as completed
      const bill = result.rows[0];
      await db.query(
        "UPDATE orders SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1",
        [bill.order_id]
      );

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get all bills
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { status, date_from, date_to, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM bills WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND payment_status = $${params.length}`;
    }

    if (date_from) {
      params.push(date_from);
      query += ` AND created_at >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      query += ` AND created_at <= $${params.length}`;
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

module.exports = router;
