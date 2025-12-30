const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const db = require('../src/config/database');
const menuRoutes = require('../src/routes/menu');

// Setup express app
const app = express();
app.use(express.json());
app.use('/api/menu', menuRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
  });
});

describe('Menu Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/menu', () => {
    it('should return full menu with categories and items', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Appetizers', description: 'Start your meal', display_order: 1 },
        { id: 'cat-2', name: 'Main Courses', description: 'Hearty dishes', display_order: 2 },
      ];

      const mockItems = [
        { id: 'item-1', category_id: 'cat-1', name: 'Spring Rolls', price: 5.99 },
        { id: 'item-2', category_id: 'cat-2', name: 'Grilled Salmon', price: 18.99 },
      ];

      db.query
        .mockResolvedValueOnce({ rows: mockCategories })
        .mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app).get('/api/menu');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.menu).toBeDefined();
      expect(response.body.data.menu).toHaveLength(2);
      expect(response.body.data.menu[0].items).toHaveLength(1);
    });

    it('should filter available items when ?available=true', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Appetizers', display_order: 1 },
      ];

      const mockItems = [
        { id: 'item-1', category_id: 'cat-1', name: 'Spring Rolls', price: 5.99, is_available: true },
      ];

      db.query
        .mockResolvedValueOnce({ rows: mockCategories })
        .mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app).get('/api/menu?available=true');

      expect(response.status).toBe(200);
      expect(db.query).toHaveBeenCalledTimes(2);
      // Check that the second query has WHERE clause
      expect(db.query.mock.calls[1][0]).toContain('WHERE m.is_available = true');
    });
  });

  describe('GET /api/menu/categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Appetizers', description: 'Start your meal', display_order: 1 },
        { id: 'cat-2', name: 'Main Courses', description: 'Hearty dishes', display_order: 2 },
      ];

      db.query.mockResolvedValueOnce({ rows: mockCategories });

      const response = await request(app).get('/api/menu/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array when no categories', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/menu/categories');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/menu/items', () => {
    it('should return all menu items with filters', async () => {
      const mockItems = [
        { id: 'item-1', category_id: 'cat-1', name: 'Spring Rolls', price: 5.99, is_available: true },
      ];

      db.query.mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app).get('/api/menu/items');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should filter by category', async () => {
      const mockItems = [
        { id: 'item-1', category_id: 'cat-1', name: 'Spring Rolls', price: 5.99 },
      ];

      db.query.mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app).get('/api/menu/items?category=cat-1');

      expect(response.status).toBe(200);
      expect(db.query.mock.calls[0][0]).toContain('AND m.category_id = $');
      expect(db.query.mock.calls[0][1]).toContain('cat-1');
    });

    it('should filter by vegetarian', async () => {
      const mockItems = [
        { id: 'item-1', category_id: 'cat-1', name: 'Garden Salad', is_vegetarian: true },
      ];

      db.query.mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app).get('/api/menu/items?vegetarian=true');

      expect(response.status).toBe(200);
      expect(db.query.mock.calls[0][0]).toContain('AND m.is_vegetarian = $');
    });

    it('should filter by search term', async () => {
      const mockItems = [
        { id: 'item-1', name: 'Spring Rolls', description: 'Crispy vegetable rolls' },
      ];

      db.query.mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app).get('/api/menu/items?search=spring');

      expect(response.status).toBe(200);
      expect(db.query.mock.calls[0][0]).toContain('ILIKE');
      expect(db.query.mock.calls[0][1]).toContain('%spring%');
    });
  });

  describe('GET /api/menu/items/:id', () => {
    it('should return single item with modifiers', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Spring Rolls',
        price: 5.99,
        category_name: 'Appetizers',
      };

      const mockModifiers = [
        { id: 'mod-1', name: 'Extra Sauce', price: 0.50 },
      ];

      db.query
        .mockResolvedValueOnce({ rows: [mockItem] })
        .mockResolvedValueOnce({ rows: mockModifiers });

      const response = await request(app).get('/api/menu/items/item-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Spring Rolls');
      expect(response.body.data.modifiers).toHaveLength(1);
    });

    it('should return 404 for non-existent item', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/menu/items/non-existent-id');

      expect(response.status).toBe(404);
    });
  });
});
