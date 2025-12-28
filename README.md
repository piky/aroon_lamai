# aroon_lamai - Restaurant Order Management System

A collaborative restaurant order management system that enables seamless communication between waitstaff and kitchen personnel, while offering customers a modern self-service ordering experience.

## Features

- 📱 **Waitstaff Ordering** - Mobile order entry from tables
- 📲 **QR Code Self-Service** - Customers order via scanned QR codes
- 🔔 **Real-time Kitchen Notifications** - Instant order alerts to kitchen displays
- 📊 **Order Status Tracking** - Live updates for all stakeholders
- 💳 **Bill Generation** - Automated billing and payment processing

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Payment**: Stripe (ready for integration)

## Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL 15+
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aroon_lamai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start PostgreSQL using Docker:
```bash
docker-compose up -d postgres
```

5. Run migrations:
```bash
npm run migrate
```

6. Seed database:
```bash
npm run seed
```

7. Start the server:
```bash
npm run dev
```

The server will be running at `http://localhost:3000`

### Using Docker

```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Menu
- `GET /api/menu` - Get full menu
- `GET /api/menu/categories` - Get categories
- `GET /api/menu/items` - Get items with filters
- `GET /api/menu/items/:id` - Get single item

### Tables
- `GET /api/tables` - List all tables
- `POST /api/tables` - Create table (admin)
- `GET /api/tables/:id` - Get table
- `PUT /api/tables/:id` - Update table (admin)
- `GET /api/tables/:id/qr` - Get QR code

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order
- `PATCH /api/orders/:id/status` - Update status
- `POST /api/orders/:id/cancel` - Cancel order

### Bills
- `GET /api/bills` - List bills (admin)
- `GET /api/bills/order/:orderId` - Get bill for order
- `POST /api/bills` - Create bill (admin)
- `PATCH /api/bills/:id/pay` - Mark as paid

### Users
- `GET /api/users` - List users (admin)
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password

## Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@aroonlamai.com | password123 | admin |
| john@aroonlamai.com | password123 | waitstaff |
| mike@aroonlamai.com | password123 | kitchen |

## Project Structure

```
aroon_lamai/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── index.js         # Entry point
├── migrations/          # Database migrations
├── seeds/               # Seed data
├── tests/               # Unit tests
├── client/              # Frontend (future)
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Development

```bash
# Run development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT
