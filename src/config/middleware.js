const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const express = require('express');
const { errorHandler } = require('../middleware/errorHandler');

const configureMiddleware = (app) => {
  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Error handling
  app.use(errorHandler);
};

module.exports = { configureMiddleware };
