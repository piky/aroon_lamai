const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
  },
}));

jest.mock('../src/config/jwt', () => ({
  generateToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyToken: jest.fn(() => ({ id: 'test-user-id', role: 'waitstaff' })),
  verifyRefreshToken: jest.fn(() => ({ id: 'test-user-id', role: 'waitstaff' })),
}));

const db = require('../src/config/database');
const ordersRoutes = require('../src/routes/orders');

// Setup express app
const app = express();
app.use(express.json());

// Mock io for routes
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};
app.set('io', mockIo);

app.use('/api/orders', ordersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
  });
});

describe('Orders Routes', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(mockClient);
  });

  describe('GET /api/orders', () => {
    it('should return list of orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          table_id: 'table-1',
          table_number: 'T1',
          status: 'pending',
          waiter_name: 'John',
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockOrders });
      // Mock getting items for each order
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should filter by status', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/orders?status=preparing')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(db.query.mock.calls[0][0]).toContain('AND o.status = $');
    });

    it('should filter by table', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/orders?table=table-uuid')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(db.query.mock.calls[0][0]).toContain('AND o.table_id = $');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return single order with items', async () => {
      const mockOrder = {
        id: 'order-1',
        table_id: 'table-1',
        table_number: 'T1',
        status: 'pending',
        waiter_name: 'John',
      };

      const mockItems = [
        { id: 'item-1', menu_item_id: 'menu-1', quantity: 2, item_name: 'Spring Rolls' },
      ];

      db.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app)
        .get('/api/orders/order-uuid')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should return 404 for non-existent order', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/orders/non-existent')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/orders', () => {
    it('should create new order successfully', async () => {
      const tableId = '123e4567-e89b-12d3-a456-426614174000';
      const menuItemId = '223e4567-e89b-12d3-a456-426614174000';
      
      const mockTable = { id: tableId };
      const mockMenuItem = { id: menuItemId, price: 10.00, name: 'Dish' };
      const mockOrder = {
        id: 'new-order-1',
        table_id: tableId,
        status: 'pending',
        table_number: 'T1',
        waiter_name: 'Test User',
      };

      // Mock database calls in transaction
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }) // INSERT order
        .mockResolvedValueOnce(undefined) // INSERT order item
        .mockResolvedValueOnce(undefined); // COMMIT

      // Mock regular db.query calls
      db.query
        .mockResolvedValueOnce({ rows: [mockTable] }) // Check table
        .mockResolvedValueOnce({ rows: [mockMenuItem] }) // Get menu item
        .mockResolvedValueOnce({ rows: [mockOrder] }) // Get full order
        .mockResolvedValueOnce({ rows: [{ id: 'item-1', item_name: 'Dish' }] }); // Get items

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer mock-token')
        .send({
          table_id: tableId,
          items: [{ menu_item_id: menuItemId, quantity: 2 }],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if table not found', async () => {
      const tableId = '123e4567-e89b-12d3-a456-426614174000';
      const menuItemId = '223e4567-e89b-12d3-a456-426614174000';
      
      db.query.mockResolvedValueOnce({ rows: [] }); // Table lookup fails

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer mock-token')
        .send({
          table_id: tableId,
          items: [{ menu_item_id: menuItemId, quantity: 2 }],
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Table not found');
    });

    it('should return 400 if no items provided', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer mock-token')
        .send({
          table_id: 'table-1',
          items: [],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order-1',
        table_id: 'table-1',
        status: 'preparing',
      };

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });

      const response = await request(app)
        .patch('/api/orders/order-uuid/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'preparing' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockIo.emit).toHaveBeenCalledWith('order:status', expect.any(Object));
    });

    it('should return 404 if order not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // UPDATE returns 0 rows

      const response = await request(app)
        .patch('/api/orders/non-existent/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'preparing' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Order not found');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/api/orders/order-uuid/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid status');
    });
  });

  describe('POST /api/orders/:id/cancel', () => {
    it('should cancel pending order', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'cancelled',
      };

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });

      const response = await request(app)
        .post('/api/orders/order-uuid/cancel')
        .set('Authorization', 'Bearer mock-token')
        .send({ reason: 'Customer left' });

      expect(response.status).toBe(200);
      expect(mockIo.to).toHaveBeenCalledWith('kitchen');
    });

    it('should return 400 if order cannot be cancelled', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/orders/order-uuid/cancel')
        .set('Authorization', 'Bearer mock-token')
        .send({ reason: 'Customer left' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/orders/:id/duplicate', () => {
    it('should duplicate existing order successfully', async () => {
      const originalOrder = {
        id: 'original-order-1',
        table_id: 'table-1',
        table_number: 'T1',
        status: 'completed',
        customer_session_id: 'session-1',
        subtotal: 50.00,
        tax_amount: 3.50,
        total_amount: 53.50,
      };

      const originalItems = [
        { id: 'item-1', menu_item_id: 'menu-1', quantity: 2, current_price: 15.00, special_instructions: 'No onions' },
        { id: 'item-2', menu_item_id: 'menu-2', quantity: 1, current_price: 20.00, special_instructions: null },
      ];

      const newOrder = {
        id: 'new-order-1',
        table_id: 'table-1',
        status: 'pending',
        table_number: 'T1',
        waiter_name: 'Test User',
      };

      // Mock getting original order
      db.query.mockResolvedValueOnce({ rows: [originalOrder] });
      // Mock getting original order items
      db.query.mockResolvedValueOnce({ rows: originalItems });
      // Mock table validation
      db.query.mockResolvedValueOnce({ rows: [{ id: 'table-1' }] });

      // Mock transaction
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [newOrder] }) // INSERT order
        .mockResolvedValueOnce(undefined) // INSERT order item 1
        .mockResolvedValueOnce(undefined) // INSERT order item 2
        .mockResolvedValueOnce(undefined); // COMMIT

      // Mock getting new order details
      db.query
        .mockResolvedValueOnce({ rows: [newOrder] })
        .mockResolvedValueOnce({ rows: [{ id: 'new-item-1', item_name: 'Dish 1' }, { id: 'new-item-2', item_name: 'Dish 2' }] });

      const response = await request(app)
        .post('/api/orders/original-order-1/duplicate')
        .set('Authorization', 'Bearer mock-token')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.message).toContain('duplicated');
      expect(mockIo.emit).toHaveBeenCalledWith('order:new', expect.objectContaining({ isDuplicated: true }));
    });

    it('should duplicate order to different table', async () => {
      const originalOrder = {
        id: 'original-order-1',
        table_id: 'table-1',
        table_number: 'T1',
        status: 'completed',
      };

      const originalItems = [
        { id: 'item-1', menu_item_id: 'menu-1', quantity: 1, current_price: 10.00, special_instructions: null },
      ];

      const newTableId = '223e4567-e89b-12d3-a456-426614174000';
      const newOrder = {
        id: 'new-order-1',
        table_id: newTableId,
        status: 'pending',
        table_number: 'T2',
      };

      // Mock getting original order
      db.query.mockResolvedValueOnce({ rows: [originalOrder] });
      // Mock getting original order items
      db.query.mockResolvedValueOnce({ rows: originalItems });
      // Mock new table validation
      db.query.mockResolvedValueOnce({ rows: [{ id: newTableId }] });

      // Mock transaction
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [newOrder] }) // INSERT order
        .mockResolvedValueOnce(undefined) // INSERT order item
        .mockResolvedValueOnce(undefined); // COMMIT

      // Mock getting new order details
      db.query
        .mockResolvedValueOnce({ rows: [newOrder] })
        .mockResolvedValueOnce({ rows: [{ id: 'new-item-1', item_name: 'Dish' }] });

      const response = await request(app)
        .post('/api/orders/original-order-1/duplicate')
        .set('Authorization', 'Bearer mock-token')
        .send({ table_id: newTableId });

      expect(response.status).toBe(201);
      expect(response.body.data.table_id).toBe(newTableId);
    });

    it('should return 404 if original order not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/orders/non-existent/duplicate')
        .set('Authorization', 'Bearer mock-token')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Order not found');
    });

    it('should return 404 if target table not found', async () => {
      const originalOrder = {
        id: 'original-order-1',
        table_id: 'table-1',
        table_number: 'T1',
        status: 'completed',
      };

      const originalItems = [
        { id: 'item-1', menu_item_id: 'menu-1', quantity: 1, current_price: 10.00, special_instructions: null },
      ];

      const invalidTableId = '223e4567-e89b-12d3-a456-426614174000';

      // Mock getting original order
      db.query.mockResolvedValueOnce({ rows: [originalOrder] });
      // Mock getting original order items
      db.query.mockResolvedValueOnce({ rows: originalItems });
      // Mock invalid table validation
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/orders/original-order-1/duplicate')
        .set('Authorization', 'Bearer mock-token')
        .send({ table_id: invalidTableId });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Target table not found');
    });

    it('should return 400 if order has no items', async () => {
      const originalOrder = {
        id: 'original-order-1',
        table_id: 'table-1',
        table_number: 'T1',
        status: 'completed',
      };

      // Mock getting original order
      db.query.mockResolvedValueOnce({ rows: [originalOrder] });
      // Mock getting original order items (empty)
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/orders/original-order-1/duplicate')
        .set('Authorization', 'Bearer mock-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('no items');
    });
  });
});
