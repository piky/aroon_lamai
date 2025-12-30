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
const tablesRoutes = require('../src/routes/tables');

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
}));

// Setup express app
const app = express();
app.use(express.json());
app.use('/api/tables', tablesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
  });
});

describe('Tables Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tables', () => {
    it('should return list of tables with active order counts', async () => {
      const mockTables = [
        { id: 'table-1', table_number: 'T1', capacity: 4, active_orders: 0 },
        { id: 'table-2', table_number: 'T2', capacity: 6, active_orders: 2 },
      ];

      db.query.mockResolvedValueOnce({ rows: mockTables });

      const response = await request(app)
        .get('/api/tables')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/tables/:id', () => {
    it('should return single table', async () => {
      const mockTable = {
        id: 'table-1',
        table_number: 'T1',
        capacity: 4,
        qr_code_url: 'data:image/png;base64,mock',
      };

      db.query.mockResolvedValueOnce({ rows: [mockTable] });

      const response = await request(app)
        .get('/api/tables/table-1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.table_number).toBe('T1');
    });

    it('should return 404 for non-existent table', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/tables/non-existent')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tables', () => {
    it('should create new table with QR code (admin only)', async () => {
      const mockTable = {
        id: 'new-table-1',
        table_number: 'T10',
        capacity: 8,
        qr_code_url: 'data:image/png;base64,mock-qr-code',
      };

      db.query.mockResolvedValueOnce({ rows: [mockTable] });

      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', 'Bearer admin-token')
        .send({
          table_number: 'T10',
          capacity: 8,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.qr_code_url).toBeDefined();
    });

    it('should return 409 if table number already exists', async () => {
      const error = new Error('Duplicate key');
      error.code = '23505';
      db.query.mockRejectedValueOnce(error);

      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', 'Bearer admin-token')
        .send({
          table_number: 'T1',
          capacity: 4,
        });

      expect(response.status).toBe(409);
    });

    it('should return 400 for invalid capacity', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', 'Bearer admin-token')
        .send({
          table_number: 'T10',
          capacity: 0,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/tables/:id', () => {
    it('should update table', async () => {
      const mockTable = {
        id: 'table-1',
        table_number: 'T1-UPDATED',
        capacity: 6,
      };

      db.query.mockResolvedValueOnce({ rows: [mockTable] });

      const response = await request(app)
        .put('/api/tables/table-1')
        .set('Authorization', 'Bearer admin-token')
        .send({
          table_number: 'T1-UPDATED',
          capacity: 6,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if table not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/api/tables/non-existent')
        .set('Authorization', 'Bearer admin-token')
        .send({ capacity: 6 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tables/:id', () => {
    it('should soft delete table', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'table-1' }] });

      const response = await request(app)
        .delete('/api/tables/table-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if table not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/api/tables/non-existent')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/tables/:id/qr', () => {
    it('should return table QR code', async () => {
      const mockTable = {
        table_number: 'T1',
        qr_code_url: 'data:image/png;base64,mock-qr',
      };

      db.query.mockResolvedValueOnce({ rows: [mockTable] });

      const response = await request(app)
        .get('/api/tables/table-1/qr')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.qr_code_url).toBeDefined();
    });
  });
});
