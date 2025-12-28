# Feature Specification: Restaurant Order Management System

**Feature Branch**: `002-baseline-specification`  
**Created**: December 28, 2025  
**Status**: Draft  
**Input**: User description from constitution

## Overview

The aroon_lamai system is a restaurant order management platform that enables efficient collaboration between waitstaff and kitchen personnel while providing self-service ordering for customers via QR code scanning.

---

## User Scenarios & Testing

### User Story 1 - Waitstaff Order Entry (Priority: P1)

Waitstaff can use their personal smartphones to take customer orders directly at the table.

**Why this priority**: Core functionality - without this, the system cannot operate. This is the primary workflow for waitstaff.

**Independent Test**: Can be tested by simulating waitstaff login, menu browsing, order creation, and submission to kitchen - delivers complete order-to-kitchen workflow.

**Acceptance Scenarios**:

1. **Given** a waitstaff member is logged in, **When** they select a table, **Then** they can view the menu and add items to the order
2. **Given** an order is being composed, **When** the waitstaff adds items with customization, **Then** the order summary shows all selections with modifiers
3. **Given** an order is complete, **When** the waitstaff submits it, **Then** the kitchen receives instant notification with order details
4. **Given** an order is submitted, **When** the waitstaff needs to modify it, **Then** they can send order updates or cancellations to the kitchen

---

### User Story 2 - Customer QR Code Self-Service Ordering (Priority: P1)

Customers scan a QR code at their table to browse the menu and place orders directly from their personal devices.

**Why this priority**: Key differentiator - enables modern self-service experience without app installation

**Independent Test**: Can be tested by simulating QR code scan, menu browsing, order placement, and payment - delivers complete customer self-service workflow.

**Acceptance Scenarios**:

1. **Given** a customer scans a table QR code, **When** they open the ordering page, **Then** they see the menu with items, prices, and descriptions
2. **Given** a customer is browsing the menu, **When** they select items with customizations, **Then** the order cart updates with selections and total price
3. **Given** an order is complete, **When** the customer submits it, **Then** the order goes directly to the kitchen with table identification
4. **Given** an order is placed, **When** the customer wants to pay, **Then** they can view the bill and complete payment

---

### User Story 3 - Kitchen Order Notification & Display (Priority: P1)

Chefs/cooks receive real-time order notifications on their smartphones or kitchen monitors.

**Why this priority**: Core functionality - kitchen staff must receive orders efficiently to prepare food

**Independent Test**: Can be tested by submitting orders and verifying kitchen devices receive notifications with complete order details.

**Acceptance Scenarios**:

1. **Given** an order is submitted from waitstaff or customer, **When** the kitchen has active devices, **Then** instant notification is delivered within 3 seconds
2. **Given** a kitchen device displays orders, **When** multiple orders arrive, **Then** they are displayed in chronological order with clear priority
3. **Given** a chef views an order, **When** they acknowledge it, **Then** the order status updates to "preparing"
4. **Given** an order is ready, **When** the chef marks it complete, **Then** the waitstaff receives notification that order is ready for serving

---

### User Story 4 - Order Status Tracking (Priority: P2)

All stakeholders can track order status from placement to completion.

**Why this priority**: Improves coordination between waitstaff and kitchen, reduces service delays

**Independent Test**: Can be tested by submitting an order and verifying status changes are visible to relevant parties throughout the workflow.

**Acceptance Scenarios**:

1. **Given** an order is submitted, **When** any stakeholder views it, **Then** the current status is visible (pending → preparing → ready → served)
2. **Given** multiple orders exist, **When** viewing the order list, **Then** orders are sortable by status and time
3. **Given** an order is being prepared, **When** its status changes, **Then** relevant parties receive status update notifications
4. **Given** a customer wants to check their order, **When** they access the order page, **Then** they see estimated preparation time

---

### User Story 5 - Bill Generation (Priority: P1)

Orders are recorded and bills can be generated upon request for payment.

**Why this priority**: Core business function - required for revenue collection

**Independent Test**: Can be tested by submitting orders, marking items as served, and generating bills with accurate totals.

**Acceptance Scenarios**:

1. **Given** items from an order are served, **When** the waitstaff marks them as delivered, **Then** the items are flagged as served in the order record
2. **Given** all items in an order are served, **When** bill generation is requested, **Then** a bill is generated with all items, prices, and total
3. **Given** a bill is generated, **When** payment is processed, **Then** the order is marked as completed and paid
4. **Given** partial payment is needed, **When** splitting bills, **Then** items can be allocated to different payments

---

## Technical Requirements

### API Requirements

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/menu` | GET | Retrieve menu items with categories |
| `/api/orders` | POST | Create new order |
| `/api/orders/:id` | GET/PUT | Get or update order |
| `/api/orders/:id/status` | PUT | Update order status |
| `/api/orders/:id/bill` | GET | Generate bill for order |
| `/api/tables/:id/qr` | GET | Generate QR code for table |
| `/api/notifications` | WebSocket | Real-time order updates |

### Database Schema (Minimum)

```
users
  - id, name, role (waitstaff, kitchen, admin), phone, email, password_hash

tables
  - id, table_number, capacity, qr_code_url

menu_categories
  - id, name, display_order

menu_items
  - id, category_id, name, description, price, image_url, available

menu_modifiers
  - id, menu_item_id, name, price_adjustment

orders
  - id, table_id, waiter_id, customer_id, status, created_at, updated_at

order_items
  - id, order_id, menu_item_id, modifier_ids, quantity, special_instructions, status

bills
  - id, order_id, total_amount, payment_status, created_at
```

### Performance Requirements

- Order submission to kitchen notification: < 3 seconds
- Menu load time: < 2 seconds
- Real-time updates via WebSocket with < 1 second latency
- Support at least 20 concurrent orders during peak hours

### Security Requirements

- All API endpoints authenticated (except menu viewing)
- Customer ordering via QR code with session validation
- Payment processing via secure third-party integration
- Data encryption in transit (HTTPS/WSS)

---

## Out of Scope (Future Phases)

- Multi-language menu support
- Advanced analytics and reporting
- Inventory management integration
- Employee scheduling
- Multi-location restaurant support
- Integration with delivery platforms
- Reservation system
- Loyalty/rewards program

---

**Specification created** - Ready for planning phase.
