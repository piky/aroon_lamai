const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Aroon Lamai Restaurant API',
    version: '1.0.0',
    description: 'Restaurant Order Management System API Documentation',
    contact: {
      name: 'API Support',
      email: 'support@aroonlamai.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          error: {
            type: 'string',
            example: 'Detailed error description',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          role: {
            type: 'string',
            enum: ['admin', 'waitstaff', 'kitchen', 'customer'],
          },
          phone: {
            type: 'string',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
            description: 'Access token for API requests',
          },
          refreshToken: {
            type: 'string',
            description: 'Token to refresh access token',
          },
        },
      },
      MenuCategory: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          display_order: {
            type: 'integer',
          },
        },
      },
      MenuItem: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          category_id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          price: {
            type: 'number',
            format: 'decimal',
          },
          image_url: {
            type: 'string',
            nullable: true,
          },
          is_available: {
            type: 'boolean',
          },
          prep_time_minutes: {
            type: 'integer',
          },
          calories: {
            type: 'integer',
            nullable: true,
          },
          is_vegetarian: {
            type: 'boolean',
          },
          is_vegan: {
            type: 'boolean',
          },
          is_gluten_free: {
            type: 'boolean',
          },
        },
      },
      Table: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          table_number: {
            type: 'string',
          },
          capacity: {
            type: 'integer',
          },
          qr_code_url: {
            type: 'string',
          },
          is_active: {
            type: 'boolean',
          },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          menu_item_id: {
            type: 'string',
            format: 'uuid',
          },
          quantity: {
            type: 'integer',
          },
          unit_price: {
            type: 'number',
            format: 'decimal',
          },
          total_price: {
            type: 'number',
            format: 'decimal',
          },
          special_instructions: {
            type: 'string',
            nullable: true,
          },
          status: {
            type: 'string',
            enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
          },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          table_id: {
            type: 'string',
            format: 'uuid',
          },
          table_number: {
            type: 'string',
          },
          waiter_id: {
            type: 'string',
            format: 'uuid',
            nullable: true,
          },
          waiter_name: {
            type: 'string',
          },
          subtotal: {
            type: 'number',
            format: 'decimal',
          },
          tax_amount: {
            type: 'number',
            format: 'decimal',
          },
          total_amount: {
            type: 'number',
            format: 'decimal',
          },
          status: {
            type: 'string',
            enum: ['pending', 'acknowledged', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OrderItem',
            },
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Bill: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          order_id: {
            type: 'string',
            format: 'uuid',
          },
          subtotal: {
            type: 'number',
            format: 'decimal',
          },
          tax_amount: {
            type: 'number',
            format: 'decimal',
          },
          tip_amount: {
            type: 'number',
            format: 'decimal',
          },
          discount_amount: {
            type: 'number',
            format: 'decimal',
          },
          total_amount: {
            type: 'number',
            format: 'decimal',
          },
          payment_status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed'],
          },
          payment_method: {
            type: 'string',
            nullable: true,
          },
          paid_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  // Path to the API docs
  apis: ['./src/routes/*.js'],
};

module.exports = { swaggerSpec: require('swagger-jsdoc')(options), swaggerDefinition };
