# E-Commerce Platform: Design Document

## Overview

Build a minimal e-commerce platform with a React frontend and Node.js/Express backend. The system must support product listings, a shopping cart, and checkout.

## Domains

### Frontend (React)
- **Task F1:** Product listing page — fetch and display products from API, with image, name, price
- **Task F2:** Shopping cart component — add/remove items, show total, persist in localStorage
- **Task F3:** Checkout form — collect shipping address and payment info, submit to order API

### Backend (Node.js/Express)
- **Task B1:** Products API — `GET /api/products` returns paginated product list from in-memory store
- **Task B2:** Cart API — `POST /api/cart` validates items and calculates totals
- **Task B3:** Orders API — `POST /api/orders` creates an order, returns confirmation ID

## Interface Contract

```
GET  /api/products         → { products: [{id, name, price, imageUrl}], total, page }
POST /api/cart             → body: {items: [{productId, qty}]} → {items, subtotal, tax, total}
POST /api/orders           → body: {cart, shipping, payment}  → {orderId, status, estimatedDelivery}
```

## Acceptance Criteria

- Product listing renders ≥ 3 products from API
- Cart persists across page refreshes
- Checkout submits and displays order confirmation
- All API endpoints return proper status codes
- Unit tests cover each API endpoint

## Notes

Two clear specialist domains (frontend + backend) with 3 tasks each. Suitable for parallel team execution.
