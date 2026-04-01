# Inventory & Billing System
### Complete Project Documentation

---

## Table of Contents

1. [Project Abstract & Objective](#1-project-abstract--objective)
2. [ER Diagram & Database Schema](#2-er-diagram--database-schema)
3. [API Documentation](#3-api-documentation)
4. [System Screenshots & Explanation](#4-system-screenshots--explanation)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Key Features](#7-key-features)
8. [Viva Questions & Answers](#8-viva-questions--answers)
9. [Presentation Script](#9-presentation-script)

---

## 1. Project Abstract & Objective

### Abstract

The **Inventory & Billing System** is a comprehensive web-based application designed to streamline inventory management and billing operations for businesses. Built with modern web technologies, this system provides a complete solution for managing products, customers, invoices, and GST calculations with real-time reporting capabilities.

### Main Objective

The primary objective of this system is to automate and digitize the entire inventory and billing process, reducing manual errors, improving efficiency, and providing business owners with accurate financial insights through comprehensive reporting and analytics.

### Problem Statement

Traditional inventory and billing systems rely heavily on manual processes, leading to:

* Errors in tax and discount calculations
* Difficulty in tracking real-time stock levels
* Challenges in generating accurate, GST-compliant invoices
* Lack of centralized reporting and analytics

### Proposed Solution

This system provides an automated, GST-compliant solution featuring:

* Real-time inventory tracking
* Dynamic discount calculations (item-level and bill-level)
* Automatic PDF invoice generation
* Comprehensive reporting and analytics
* A clean, user-friendly web interface accessible to non-technical staff

---

## 2. ER Diagram & Database Schema

### Entity Relationship Diagram

```
┌─────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
│       Product        │        │       Customer        │        │       Invoice         │
├─────────────────────┤        ├──────────────────────┤        ├──────────────────────┤
│ _id                 │        │ _id                  │        │ _id                  │
│ name                │        │ name                 │        │ invoiceNumber        │
│ hsnCode             │        │ mobile               │        │ customerName         │
│ price               │        │ email                │        │ customerEmail        │
│ stock               │        │ state                │        │ items                │
│ category            │        │ gstNumber            │        │ totalAmount          │
│ gstRate             │        │ address              │        │ status               │
│ discountType        │        └──────────────────────┘        │ paymentStatus        │
│ discountPercent     │                   │                     │ isInterState         │
│ lowStockThreshold   │               1 ──┤                     │ createdBy            │
└─────────────────────┘                   │                     │ createdAt            │
           │                              ▼                     └──────────────────────┘
       1 ──┤                   ┌──────────────────────┐                    │
           ▼                   │     InvoiceItem       │              1 ───┤
┌─────────────────────┐        ├──────────────────────┤                   ▼
│        User          │        │ _id                  │        ┌──────────────────────┐
├─────────────────────┤        │ invoiceId            │        │       Setting         │
│ _id                 │        │ productId            │        ├──────────────────────┤
│ name                │        │ quantity             │        │ _id                  │
│ email               │        │ price                │        │ storeName            │
│ mobile              │        │ discountAmount       │        │ gstNumber            │
│ password            │        │ taxableValue         │        │ address              │
│ role                │        │ gstAmount            │        │ phone                │
│ isActive            │        │ total                │        │ email                │
└─────────────────────┘        └──────────────────────┘        │ cgstPercent          │
                                                                │ sgstPercent          │
                                                                │ state                │
                                                                └──────────────────────┘
```

### Schema Descriptions

#### Product Entity
Stores all product information including name, HSN code, price, stock levels, category, GST rate, and discount details. Each product supports multiple discount types — percentage-based or flat amount.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique product identifier |
| `name` | String | Product name |
| `hsnCode` | String | HSN code for GST classification |
| `price` | Number | Base selling price |
| `stock` | Number | Current stock quantity |
| `category` | String | Product category |
| `gstRate` | Number | Applicable GST rate (%) |
| `discountType` | String | `percentage` or `flat` |
| `discountPercent` | Number | Discount value |
| `lowStockThreshold` | Number | Trigger level for low stock alert |

#### Customer Entity
Maintains customer records with contact details, GST number, and state information for accurate GST determination (CGST/SGST for intra-state, IGST for inter-state).

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique customer identifier |
| `name` | String | Customer full name |
| `mobile` | String | Mobile number |
| `email` | String | Email address |
| `state` | String | State for GST type determination |
| `gstNumber` | String | Customer's GSTIN |
| `address` | String | Billing address |

#### Invoice Entity
The central entity that stores complete invoice details, including customer info, itemized breakdown, GST summary, and payment status.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique invoice identifier |
| `invoiceNumber` | String | Auto-generated invoice number (e.g., INV-0001) |
| `customerName` | String | Snapshot of customer name |
| `customerEmail` | String | Snapshot of customer email |
| `items` | Array | Array of InvoiceItem references |
| `totalAmount` | Number | Final payable amount |
| `status` | String | `active` or `cancelled` |
| `paymentStatus` | String | Payment state |
| `isInterState` | Boolean | Determines CGST/SGST vs IGST |
| `createdBy` | ObjectId | User who created the invoice |
| `createdAt` | Date | Invoice creation timestamp |

#### InvoiceItem Entity
Stores individual line items within an invoice, capturing product details, quantities, prices, discounts, and GST calculations at the time of billing.

| Field | Type | Description |
|---|---|---|
| `invoiceId` | ObjectId | Parent invoice reference |
| `productId` | ObjectId | Product reference |
| `quantity` | Number | Quantity billed |
| `price` | Number | Unit price at time of billing |
| `discountAmount` | Number | Discount applied |
| `taxableValue` | Number | Value after discount, before GST |
| `gstAmount` | Number | Total GST charged |
| `total` | Number | Final line total |

#### User Entity
Manages system users with authentication, role-based access control, and activity tracking.

| Field | Type | Description |
|---|---|---|
| `name` | String | User's full name |
| `email` | String | Login email |
| `mobile` | String | Mobile number |
| `password` | String | Bcrypt-hashed password |
| `role` | String | `admin` or `cashier` |
| `isActive` | Boolean | Account active status |

#### Setting Entity
Stores business-level configuration including store name, GST number, tax percentages, and address details.

---

## 3. API Documentation

> **Base URL:** `/api`  
> **Authentication:** All protected routes require a Bearer JWT token in the `Authorization` header.

---

### 3.1 Authentication APIs

#### `POST /api/users/login`
Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "mobile": "9876543210",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "...",
    "name": "John Doe",
    "role": "admin"
  }
}
```

---

#### `POST /api/users/register`
Registers a new user (admin only).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "password",
  "role": "cashier"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "...",
    "name": "John Doe",
    "role": "cashier"
  }
}
```

---

### 3.2 Product Management APIs

#### `GET /api/products`
Fetches a paginated list of products with optional search and sorting.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Results per page (default: 5) |
| `search` | String | Search by product name |
| `sortBy` | String | Field to sort by |
| `order` | String | `asc` or `desc` |

**Response:**
```json
{
  "success": true,
  "pagination": { "currentPage": 1, "totalPages": 10 },
  "products": [{ "id": "...", "name": "Product A", "price": 100, "stock": 50 }]
}
```

---

#### `POST /api/products`
Adds a new product.

**Request Body:**
```json
{
  "name": "Product A",
  "hsnCode": "12345",
  "price": 100,
  "category": "Electronics",
  "stock": 50,
  "gstRate": 18,
  "discountPercentage": 10,
  "discountType": "percentage"
}
```

---

#### `PUT /api/products/:id`
Updates an existing product by ID.

**Request Body:**
```json
{
  "name": "Updated Product",
  "price": 120,
  "stock": 40
}
```

---

#### `DELETE /api/products/:id`
Deletes a product by ID.

**Response:**
```json
{ "success": true, "message": "Product deleted successfully" }
```

---

### 3.3 Customer Management APIs

#### `GET /api/customers`
Fetches a paginated list of customers.

**Query Parameters:** `page`, `limit`, `search`, `sortBy`, `order`

---

#### `POST /api/customers/add`
Adds a new customer.

**Request Body:**
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "address": "123 Main Street",
  "gstNumber": "GST123456",
  "state": "Gujarat"
}
```

---

#### `GET /api/customers/:id`
Fetches a single customer's details by ID.

---

#### `PUT /api/customers/:id`
Updates a customer record by ID.

---

#### `DELETE /api/customers/:id`
Deletes a customer by ID.

---

### 3.4 Invoice Management APIs

#### `POST /api/invoices`
Creates a new GST-compliant invoice.

**Request Body:**
```json
{
  "customerId": "...",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "items": [
    { "product": "...", "quantity": 2, "discountPercent": 10 }
  ],
  "billDiscountValue": 5,
  "billDiscountType": "percentage"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": { "id": "...", "invoiceNumber": "INV-0001", "totalAmount": 1000 }
}
```

---

#### `GET /api/invoices`
Fetches all invoices with pagination and search.

**Query Parameters:** `page`, `limit`, `search`, `sortBy`, `order`

---

#### `GET /api/invoices/:id`
Fetches complete details of a single invoice including all line items.

---

#### `PATCH /api/invoices/:id/cancel`
Cancels an invoice. Stock is restored upon cancellation.

---

#### `GET /api/invoices/daily-report`
Generates a daily sales summary report.

**Query Parameters:**

| Parameter | Example | Description |
|---|---|---|
| `date` | `2026-04-01` | Date for the report |

**Response:**
```json
{
  "success": true,
  "date": "2026-04-01",
  "totalInvoices": 5,
  "totalSales": 5000,
  "data": [{ "invoiceNumber": "INV-0001", "totalAmount": 1000 }]
}
```

---

### 3.5 Dashboard API

#### `GET /api/dashboard`
Returns aggregated business metrics, recent invoices, sales chart data, GST breakdown, and low stock alerts.

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "totalInvoices": 100,
    "totalProducts": 50,
    "totalCustomers": 30,
    "totalSales": 50000,
    "cancelledInvoicesCount": 5
  },
  "recentInvoices": [...],
  "salesChart": [{ "_id": "2026-03", "total": 15000 }],
  "gstData": {
    "totalCGST": 1000,
    "totalSGST": 1000,
    "totalIGST": 0
  },
  "lowStockProducts": [{ "name": "Product A", "stock": 2, "lowStockThreshold": 10 }]
}
```

---

## 4. System Screenshots & Explanation

### Dashboard Overview
The main dashboard provides a comprehensive overview of business performance, featuring key metrics (total invoices, products, customers, and revenue), interactive sales trend charts, a GST breakdown panel, recent invoice history, and low stock alerts for proactive inventory management.

### Product Management
The products page allows administrators to manage the full product catalogue with pagination, search, and column-based sorting. Users can add new products with all relevant details — including HSN codes, GST rates, and discount configuration — or update existing entries with real-time stock adjustments.

### Customer Management
The customer management interface supports full CRUD operations on customer records. It includes GSTIN validation and state selection fields to ensure accurate tax type determination (CGST/SGST vs. IGST), along with a search bar for quick lookups.

### Invoice Generation
The invoice creation page offers a dynamic billing interface. Users select a customer, add products line by line, apply item-level discounts and a bill-level discount, and the system automatically computes the taxable value, GST split, and final total — all in real time.

### Invoice List
A searchable, paginated view of all generated invoices. Users can drill into individual invoice details, download them as PDFs, or cancel invoices when required, with instant status updates.

### Reports Dashboard
The reports section provides daily and monthly sales summaries, GST breakdowns by tax type, and the ability to generate PDF reports for official documentation and compliance filing.

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React.js | Component-based UI framework |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Charts** | Chart.js | Sales and GST data visualization |
| **Routing** | React Router | Client-side navigation |
| **HTTP Client** | Axios | API communication |
| **Backend** | Node.js + Express.js | RESTful API server |
| **Database** | MongoDB + Mongoose | Document-based data persistence |
| **Authentication** | JWT (JSON Web Tokens) | Stateless user authentication |
| **Password Hashing** | bcrypt | Secure credential storage |
| **PDF Generation** | PDFKit | Invoice and report generation |
| **Frontend Deploy** | Vercel | Static hosting with CDN |
| **Backend Deploy** | Render | Node.js server hosting |

---

## 6. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                         │
│         React.js · Tailwind CSS · Chart.js                │
│         React Router · Axios HTTP Client                  │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼──────────────────────────────┐
│                       API LAYER                           │
│         Express.js RESTful APIs                           │
│         JWT Middleware · Role-based Access Control        │
│         Input Validation & Sanitization                   │
└───────────────────────────┬──────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
┌────────▼────────┐                  ┌─────────▼─────────┐
│  DATABASE LAYER │                  │   FILE STORAGE    │
│  MongoDB Atlas  │                  │  PDFKit Output    │
│  Mongoose ODM   │                  │  Invoice PDFs     │
└─────────────────┘                  └───────────────────┘
```

**Layer Responsibilities:**

* **Client Layer** — Handles all UI rendering, user interactions, and API communication. Implements responsive design for desktop and tablet usage.
* **API Layer** — Exposes RESTful endpoints, enforces authentication, validates input, and orchestrates business logic including GST calculations.
* **Database Layer** — Persists all application data with proper schema relationships and indexing for query performance.
* **File Storage** — Manages dynamically generated PDF invoices and reports using PDFKit.

---

## 7. Key Features

### Product Management
* Add, edit, and delete products with complete details
* HSN code support for GST classification
* Configurable GST rates per product
* Percentage and flat discount types
* Real-time stock tracking with low-stock threshold alerts

### Customer Management
* Full CRUD operations for customer records
* GSTIN validation
* State-based GST type determination
* Searchable customer directory

### Invoice Generation
* Dynamic, real-time invoice builder
* Item-level discount support (percentage or flat)
* Bill-level discount support
* Automatic CGST/SGST (intra-state) and IGST (inter-state) calculation
* Auto-incremented invoice numbers (INV-0001, INV-0002, ...)
* PDF invoice download

### GST Compliance
* Supports all standard GST slabs (0%, 5%, 12%, 18%, 28%)
* Automatic intra-state vs. inter-state detection
* CGST/SGST split for local transactions
* IGST for cross-state transactions
* GST-compliant PDF invoices

### Reporting & Analytics
* Real-time dashboard with KPIs
* Monthly sales trend charts
* GST collection breakdown (CGST / SGST / IGST)
* Daily sales reports with PDF export
* Low stock alerts

### Security & Access Control
* JWT-based authentication
* Role-based access: `admin` and `cashier` roles
* Bcrypt password hashing
* Protected API endpoints via middleware

