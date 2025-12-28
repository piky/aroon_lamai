const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get full menu with categories
router.get('/', async (req, res, next) => {
  try {
    const { available } = req.query;

    let categoryQuery = `
      SELECT id, name, description, display_order
      FROM menu_categories
      WHERE is_active = true
      ORDER BY display_order
    `;

    let itemQuery = `
      SELECT 
        m.id, m.category_id, m.name, m.description, m.price, 
        m.image_url, m.is_available, m.prep_time_minutes, m.calories,
        m.is_vegetarian, m.is_vegan, m.is_gluten_free
      FROM menu_items m
    `;

    if (available === 'true') {
      itemQuery += ' WHERE m.is_available = true';
    }

    const [categoriesResult, itemsResult] = await Promise.all([
      db.query(categoryQuery),
      db.query(itemQuery),
    ]);

    // Group items by category
    const menu = categoriesResult.rows.map(category => ({
      ...category,
      items: itemsResult.rows.filter(item => item.category_id === category.id),
    }));

    res.json({
      success: true,
      data: { menu },
    });
  } catch (error) {
    next(error);
  }
});

// Get categories only
router.get('/categories', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, display_order 
       FROM menu_categories 
       WHERE is_active = true 
       ORDER BY display_order`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Get items with filters
router.get('/items', async (req, res, next) => {
  try {
    const { category, available, search, vegetarian, vegan, gluten_free } = req.query;

    let query = `
      SELECT 
        m.id, m.category_id, c.name as category_name, m.name, m.description, 
        m.price, m.image_url, m.is_available, m.prep_time_minutes, m.calories,
        m.is_vegetarian, m.is_vegan, m.is_gluten_free
      FROM menu_items m
      JOIN menu_categories c ON m.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND m.category_id = $${params.length}`;
    }

    if (available === 'true') {
      params.push(true);
      query += ` AND m.is_available = $${params.length}`;
    }

    if (vegetarian === 'true') {
      params.push(true);
      query += ` AND m.is_vegetarian = $${params.length}`;
    }

    if (vegan === 'true') {
      params.push(true);
      query += ` AND m.is_vegan = $${params.length}`;
    }

    if (gluten_free === 'true') {
      params.push(true);
      query += ` AND m.is_gluten_free = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (m.name ILIKE $${params.length} OR m.description ILIKE $${params.length})`;
    }

    query += ' ORDER BY c.display_order, m.name';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Get single item with modifiers
router.get('/items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const itemResult = await db.query(
      `SELECT 
        m.*, c.name as category_name
       FROM menu_items m
       JOIN menu_categories c ON m.category_id = c.id
       WHERE m.id = $1`,
      [id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const modifiersResult = await db.query(
      'SELECT * FROM menu_modifiers WHERE menu_item_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...itemResult.rows[0],
        modifiers: modifiersResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
