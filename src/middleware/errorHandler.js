class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle specific error types
  if (err.code === '23505') {
    // PostgreSQL unique violation
    err.statusCode = 409;
    err.message = 'Resource already exists';
  }

  if (err.code === '23503') {
    // PostgreSQL foreign key violation
    err.statusCode = 400;
    err.message = 'Referenced resource does not exist';
  }

  if (err.code === 'ECONNREFUSED') {
    err.statusCode = 503;
    err.message = 'Database connection failed';
  }

  // Send response
  const response = {
    success: false,
    status: err.status,
    message: err.isOperational ? err.message : 'Internal server error',
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = err.message;
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

module.exports = { AppError, errorHandler };
