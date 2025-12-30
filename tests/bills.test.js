const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../src/config/jwt', () => ({
  generateToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyToken: jest.fn((token) => {
    if (token === 'admin-token') {
      return { id: 'admin-user-id', role: 'admin' };
    }
    return { id: 'test-user-id', role: 'waitstaff' };
  }),
  verifyRefreshToken: jest.fn(() => ({ id: 'test-user-id', role: 'waitstaff' })),
}));

const db = require('../src/config/database');
const billsRoutes = require('../src/routes/bills');

// Setup express app
const app = express();
app.use(express.json());
app.use('/api/bills', billsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
  });
});

describe('Bills Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/bills/order/:orderId', () => {
    it('should return bill preview for order', async () => {
      const mockOrder = {
        id: 'order-1',
        table_id: 'table-1',
        table_number: 'T1',
      };

      const mockItems = [
        { id: 'item-1', total_price: 10.00, status: 'served' },
        { id: 'item-2', total_price: 15.00, status: 'served' },
        { id: 'item-3', total_price: 8.00, status: 'pending' },
      ];

      db.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app)
        .get('/api/bills/order/order-1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subtotal).toBe(25); // Only served items
      expect(response.body.data.pending_items_count).toBe(1);
    });

    it('should return 404 if order not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/bills/order/non-existent')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/bills/:id', () => {
    it('should return bill by ID', async () => {
      const mockBill = {
        id: 'bill-1',
        order_id: 'order-1',
        subtotal: 25.00,
        tax_amount: 1.75,
        total_amount: 26.75,
        payment_status: 'pending',
      };

      db.query.mockResolvedValueOnce({ rows: [mockBill] });

      const response = await request(app)
        .get('/api/bills/bill-1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment_status).toBe('pending');
    });

    it('should return 404 if bill not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/bills/non-existent')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/bills', () => {
    it('should create bill for order (admin only)', async () => {
      const mockOrder = {
        id: 'order-1',
        table_id: 'table-1',
        table_number: 'T1',
      };

      const mockServedItems = [
        { total_price: 25.00 },
      ];

      const mockBill = {
        id: 'new-bill-1',
        order_id: 'order-1',
        subtotal: 25.00,
        tax_amount: 1.75,
        total_amount: 26.75,
        payment_status: 'pending',
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: mockServedItems })
        .mockResolvedValueOnce({ rows: [mockBill] });

      const response = await request(app)
        .post('/api/bills')
        .set('Authorization', 'Bearer admin-token')
        .send({ order_id: 'order-1' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment_status).toBe('pending');
    });

    it('should create bill with tip and discount', async () => {
      const mockOrder = {
        id: 'order-1',
        table_id: 'table-1',
        table_number: 'T1',
      };

      const mockServedItems = [
        { total_price: 100.00 },
      ];

      const mockBill = {
        id: 'new-bill-1',
        order_id: 'order-1',
        subtotal: 100.00,
        tax_amount: 7.00,
        tip_amount: 10.00,
        discount_amount: 5.00,
        total_amount: 112.00,
        payment_status: 'pending',
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: mockServedItems })
        .mockResolvedValueOnce({ rows: [mockBill] });

      const response = await request(app)
        .post('/api/bills')
        .set('Authorization', 'Bearer admin-token')
        .send({
          order_id: 'order-1',
          tip_amount: 10.00,
          discount_amount: 5.00,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tip_amount).toBe(10);
      expect(response.body.data.discount_amount).toBe(5);
    });

    it('should return 404 if order not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/bills')
        .set('Authorization', 'Bearer admin-token')
        .send({ order_id: 'non-existent' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/bills/:id/pay', () => {
    it('should mark bill as paid', async () => {
      const mockBill = {
        id: 'bill-1',
        order_id: 'order-1',
        payment_status: 'completed',
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockBill] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .patch('/api/bills/bill-1/pay')
        .set('Authorization', 'Bearer mock-token')
        .send({
          payment_method: 'card',
          payment_reference: 'REF123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 if bill already paid', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .patch('/api/bills/bill-1/pay')
        .set('Authorization', 'Bearer mock-token')
        .send({
          payment_method: 'card',
          payment_reference: 'REF123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/bills', () => {
    it('should return list of bills (admin only)', async () => {
      const mockBills = [
        { id: 'bill-1', payment_status: 'completed' },
        { id: 'bill-2', payment_status: 'pending' },
      ];

      db.query.mockResolvedValueOnce({ rows: mockBills });

      const response = await request(app)
        .get('/api/bills')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by payment status', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/bills?status=completed')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(db.query.mock.calls[0][0]).toContain('AND payment_status = $');
    });
  });
});
