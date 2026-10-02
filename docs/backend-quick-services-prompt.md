# Backend Engineering Prompt: Standalone Quick Home Services (`Dishwashing-Only` & `Quick Laundry Wash & Drop`)

## Goal
Implement backend support in the Lofix backend service for standalone **"Dishwashing-Only"** and **"Quick Laundry Wash & Drop Home Service"** requests, allowing customers to book these quick services directly from the homepage.

---

## 1. Database Schema & Entities

### `quick_service_requests` Table
- `id`: Primary Key (Incrementing integer / UUID)
- `account_id`: Foreign Key linking to `accounts` (`id`)
- `service_type`: Enum or String (`'DISHWASHING'` or `'LAUNDRY'`)
- `quantity`: Integer (number of loads/baskets, min 1)
- `unit_price`: Integer (amount in kobo, e.g., 350000 for ₦3,500 dishwashing, 500000 for ₦5,000 laundry)
- `total_amount`: Integer (kobo integer)
- `address`: Text (delivery location)
- `phone`: String (contact phone)
- `scheduled_at`: Timestamp (scheduled date & time)
- `status`: Enum (`'PENDING_PAYMENT'`, `'PAID'`, `'ASSIGNED'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'CANCELLED'`)
- `transaction_id`: Foreign Key linking to `system_transactions` (`id`)
- `created_at`: Timestamp
- `updated_at`: Timestamp

---

## 2. Endpoints Specification

### A. Create Quick Service Booking
- **Route:** `POST /quick-services/bookings`
- **Headers:** `Authorization: Bearer <jwt_token>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "serviceType": "DISHWASHING",
    "quantity": 2,
    "address": "15 Admiralty Way, Lekki Phase 1, Lagos",
    "phone": "08031234567",
    "scheduledAt": "2026-10-01T09:00:00Z"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "bookingId": 301,
    "transactionId": 802,
    "totalAmount": 700000,
    "status": "PENDING_PAYMENT"
  }
  ```

### B. Fetch User Quick Service Bookings
- **Route:** `GET /quick-services/my-bookings`
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Response (`200 OK`):** Array of quick service booking objects.

---

## 3. Integration Guidelines
- Integrate payment initialization (`POST /transactions/{transactionId}/payments/initialize`) and verification (`POST /transactions/{transactionId}/payments/verify`) so quick service bookings use the existing Lofix system transaction & Paystack checkout flow.
- Ensure proper validation against unauthorized access and invalid quantities.
