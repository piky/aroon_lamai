const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

const seedData = async () => {
  try {
    console.log('Seeding database...');

    // Clear existing data
    await pool.query('DELETE FROM order_item_modifiers');
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM bills');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM menu_modifiers');
    await pool.query('DELETE FROM menu_items');
    await pool.query('DELETE FROM menu_categories');
    await pool.query('DELETE FROM tables');
    await pool.query('DELETE FROM users');

    // Create users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = [
      { name: 'Admin User', email: 'admin@aroonlamai.com', role: 'admin' },
      { name: 'John Waiter', email: 'john@aroonlamai.com', role: 'waitstaff' },
      { name: 'Jane Waiter', email: 'jane@aroonlamai.com', role: 'waitstaff' },
      { name: 'Chef Mike', email: 'mike@aroonlamai.com', role: 'kitchen' },
      { name: 'Chef Anna', email: 'anna@aroonlamai.com', role: 'kitchen' },
    ];

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [user.name, user.email, passwordHash, user.role]
      );
    }
    console.log('✓ Users created');

    // Create tables
    for (let i = 1; i <= 20; i++) {
      await pool.query(
        'INSERT INTO tables (table_number, capacity, qr_code_url) VALUES ($1, $2, $3)',
        [`T-${i.toString().padStart(2, '0')}`, Math.ceil(Math.random() * 4) + 2, `/qr/table-${i}`]
      );
    }
    console.log('✓ Tables created');

    // Create menu categories
    const categories = [
      { name: 'Appetizers', description: 'Start your meal right', order: 1 },
      { name: 'Main Courses', description: 'Hearty main dishes', order: 2 },
      { name: 'Rice & Noodles', description: 'Traditional rice and noodle dishes', order: 3 },
      { name: 'Seafood', description: 'Fresh from the ocean', order: 4 },
      { name: 'Vegetables', description: 'Fresh and healthy options', order: 5 },
      { name: 'Desserts', description: 'Sweet endings', order: 6 },
      { name: 'Beverages', description: 'Drinks and refreshments', order: 7 },
    ];

    for (const cat of categories) {
      await pool.query(
        'INSERT INTO menu_categories (name, description, display_order) VALUES ($1, $2, $3)',
        [cat.name, cat.description, cat.order]
      );
    }
    console.log('✓ Categories created');

    // Create menu items
    const menuItems = [
      // Appetizers
      { category: 'Appetizers', name: 'Spring Rolls', description: 'Crispy vegetable spring rolls served with sweet chili sauce', price: 120, prep: 10 },
      { category: 'Appetizers', name: 'Tom Yum Soup', description: 'Hot and sour Thai soup with shrimp', price: 150, prep: 8 },
      { category: 'Appetizers', name: 'Satay Skewers', description: 'Grilled chicken satay with peanut sauce', price: 180, prep: 12 },
      { category: 'Appetizers', name: 'Papaya Salad', description: 'Spicy green papaya salad with lime dressing', price: 100, prep: 5 },
      
      // Main Courses
      { category: 'Main Courses', name: 'Pad Thai', description: 'Stir-fried rice noodles with shrimp, eggs, and peanuts', price: 200, prep: 15 },
      { category: 'Main Courses', name: 'Green Curry', description: 'Thai green curry with chicken and bamboo shoots', price: 220, prep: 18 },
      { category: 'Main Courses', name: 'Massaman Curry', description: 'Rich and mild curry with potatoes and peanuts', price: 250, prep: 20 },
      { category: 'Main Courses', name: 'Basil Chicken', description: 'Stir-fried chicken with holy basil and chilies', price: 180, prep: 12 },
      { category: 'Main Courses', name: 'Grilled Sea Bass', description: 'Whole grilled sea bass with garlic and herbs', price: 350, prep: 25 },
      
      // Rice & Noodles
      { category: 'Rice & Noodles', name: 'Fried Rice', description: 'Thai-style fried rice with shrimp and vegetables', price: 150, prep: 10 },
      { category: 'Rice & Noodles', name: 'Jasmine Rice', description: 'Steamed jasmine rice', price: 40, prep: 5 },
      { category: 'Rice & Noodles', name: 'Pad See Ew', description: 'Stir-fried rice noodles with soy sauce', price: 170, prep: 12 },
      
      // Seafood
      { category: 'Seafood', name: 'Garlic Shrimp', description: 'Fresh shrimp sautéed with garlic and butter', price: 280, prep: 15 },
      { category: 'Seafood', name: 'Fish & Chips', description: 'Beer-battered fish with crispy fries', price: 250, prep: 18 },
      
      // Vegetables
      { category: 'Vegetables', name: 'Stir-Fried Vegetables', description: 'Seasonal vegetables with oyster sauce', price: 120, prep: 10 },
      { category: 'Vegetables', name: 'Tofu Cashew', description: 'Crispy tofu with cashew nuts', price: 160, prep: 12 },
      
      // Desserts
      { category: 'Desserts', name: 'Mango Sticky Rice', description: 'Sweet sticky rice with fresh mango', price: 100, prep: 5 },
      { category: 'Desserts', name: 'Coconut Ice Cream', description: 'Creamy coconut ice cream', price: 80, prep: 2 },
      { category: 'Desserts', name: 'Banana Fritters', description: 'Crispy fried bananas with honey', price: 90, prep: 8 },
      
      // Beverages
      { category: 'Beverages', name: 'Thai Iced Tea', description: 'Sweet condensed milk tea', price: 60, prep: 3 },
      { category: 'Beverages', name: 'Coconut Water', description: 'Fresh young coconut water', price: 50, prep: 1 },
      { category: 'Beverages', name: 'Fresh Lime Soda', description: 'Sparkling lime soda', price: 45, prep: 2 },
      { category: 'Beverages', name: 'Thai Coffee', description: 'Strong Thai-style coffee', price: 55, prep: 3 },
    ];

    for (const item of menuItems) {
      const catResult = await pool.query(
        'SELECT id FROM menu_categories WHERE name = $1',
        [item.category]
      );
      await pool.query(
        `INSERT INTO menu_items (category_id, name, description, price, prep_time_minutes)
         VALUES ($1, $2, $3, $4, $5)`,
        [catResult.rows[0].id, item.name, item.description, item.price, item.prep]
      );
    }
    console.log('✓ Menu items created');

    // Create menu modifiers
    const modifiers = [
      { item: 'Spring Rolls', name: 'Extra Sauce', price: 10 },
      { item: 'Pad Thai', name: 'No Peanuts', price: 0 },
      { item: 'Pad Thai', name: 'Extra Tofu', price: 30 },
      { item: 'Green Curry', name: 'Spicy Level 1', price: 0 },
      { item: 'Green Curry', name: 'Spicy Level 2', price: 0 },
      { item: 'Green Curry', name: 'Spicy Level 3', price: 0 },
      { item: 'Garlic Shrimp', name: 'Extra Garlic', price: 20 },
      { item: 'Fried Rice', name: 'Shrimp', price: 40 },
      { item: 'Fried Rice', name: 'Chicken', price: 30 },
      { item: 'Fried Rice', name: 'Vegetarian', price: 0 },
    ];

    for (const mod of modifiers) {
      const itemResult = await pool.query(
        'SELECT id FROM menu_items WHERE name = $1',
        [mod.item]
      );
      if (itemResult.rows.length > 0) {
        await pool.query(
          'INSERT INTO menu_modifiers (menu_item_id, name, price_adjustment) VALUES ($1, $2, $3)',
          [itemResult.rows[0].id, mod.name, mod.price]
        );
      }
    }
    console.log('✓ Menu modifiers created');

    console.log('\n✓ Database seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
};

seedData();
