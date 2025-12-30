const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');

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
const usersRoutes = require('../src/routes/users');

// Setup express app
const app = express();
app.use(express.json());
app.use('/api/users', usersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
  });
});

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return list of users (admin only)', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John', email: 'john@example.com', role: 'waitstaff' },
        { id: 'user-2', name: 'Jane', email: 'jane@example.com', role: 'admin' },
      ];

      db.query.mockResolvedValueOnce({ rows: mockUsers });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by role', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/users?role=admin')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(db.query.mock.calls[0][0]).toContain('AND role = $');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'waitstaff',
        phone: '1234567890',
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 404 if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: 'test-user-id',
        name: 'Updated Name',
        email: 'test@example.com',
        role: 'waitstaff',
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer mock-token')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });
  });

  describe('PUT /api/users/password', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        password_hash: await bcrypt.hash('oldpassword', 10),
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer mock-token')
        .send({
          current_password: 'oldpassword',
          new_password: 'newpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 for wrong current password', async () => {
      const mockUser = {
        id: 'test-user-id',
        password_hash: await bcrypt.hash('oldpassword', 10),
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer mock-token')
        .send({
          current_password: 'wrongpassword',
          new_password: 'newpassword123',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for short new password', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer mock-token')
        .send({
          current_password: 'oldpassword',
          new_password: '123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user (admin only)', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Updated User',
        email: 'updated@example.com',
        role: 'waitstaff',
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .put('/api/users/user-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'Updated User' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/api/users/non-existent')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should deactivate user (admin only)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'user-1' }] });

      const response = await request(app)
        .delete('/api/users/user-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/api/users/non-existent')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
    });
  });
});
