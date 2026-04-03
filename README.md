# Inventory & Billing System
### Complete Project Documentation

---

## Table of Contents

1. [Project Abstract & Objective](#1-project-abstract--objective)
2. [API Documentation](#2-api-documentation)
3. [System Screenshots & Explanation](#3-system-screenshots--explanation)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Key Features](#6-key-features)
7. [ER Diagram & Database Schema](./ER_DIAGRAM.md)

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

## 2. API Documentation

> **Base URL:** `/api`  
> **Authentication:** All protected routes require a Bearer JWT token in the `Authorization` header.

---

### 2.1 Authentication APIs

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
Registers a new user. **Public (open registration).**

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

#### `GET /api/users`
Fetches all users. **Admin only.**

---

### 2.2 Product Management APIs

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
Adds a new product. **Admin only.**

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
Updates an existing product by ID. **Admin only.**

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
Deletes a product by ID. **Admin only.**

**Response:**
```json
{ "success": true, "message": "Product deleted successfully" }
```

---

### 2.3 Customer Management APIs

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

#### `GET /api/customers/search/:mobile`
Searches customer by mobile number.

---

### 2.4 Invoice Management APIs

#### `POST /api/invoices`
Creates a new GST-compliant invoice.

**Request Body:**
```json
{
  "customerId": "...",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "items": [
    { "product": "...", "quantity": 2, "discountPercent": 10, "discountType": "percentage" }
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
  "data": { "_id": "...", "invoiceNumber": "INV-0001", "totalAmount": 1000 }
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

#### `PUT /api/invoices/:id`
Updates invoice (customerName, customerEmail, paymentStatus). **Admin only.**

---

#### `PATCH /api/invoices/:id/cancel`
Cancels an invoice. Stock is restored upon cancellation. **Admin only.**

---

#### `GET /api/invoices/cancelled`
Fetches all cancelled invoices. **Admin only.**

---

#### `GET /api/invoices/daily-report?date=YYYY-MM-DD`
Generates a daily sales summary report. **Admin only.**

---

#### `GET /api/invoices/reports/monthly?month=X&year=YYYY`
Generates monthly sales + GST report. **Admin only.**

---

#### `GET /api/invoices/reports/monthly/pdf?month=X&year=YYYY`
Generates monthly PDF report. **Admin only.**

---

#### `GET /api/invoices/invoice/:id/pdf`
Downloads invoice PDF.

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

### 2.5 Dashboard API

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

## 3. System Screenshots & Explanation

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

## 4. Technology Stack

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

## 5. System Architecture

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

## 6. Key Features

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

---

## 7. ER Diagram & Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      USER       │       │    CUSTOMER    │       │    PRODUCT     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ _id (PK)        │       │ _id (PK)        │       │ _id (PK)        │
│ name            │       │ name            │       │ name            │
│ email           │       │ mobile          │       │ hsnCode         │
│ mobile          │       │ email           │       │ price           │
│ password        │       │ address         │       │ stock           │
│ role            │       │ state           │       │ category        │
│ isActive        │       │ gstNumber       │       │ gstRate         │
│ createdAt       │       │ createdAt       │       │ discountPercent │
└─────────────────┘       └─────────────────┘       │ discountType    │
      │                         │                  │ lowStockThresh  │
      │                         │                  │ createdAt       │
      │                         │                  └─────────────────┘
      │                         │                        │
      │                         │                        │
      └─────────────────────────┼────────────────────────┘
                               │
                    ┌───────────▼───────────┐
                    │       INVOICE        │
                    ├───────────────────────┤
                    │ _id (PK)              │
                    │ invoiceNumber (UQ)    │
                    │ customerName          │
                    │ customerEmail          │
                    │ createdBy (FK → User) │
                    │ items []              │◄───┐
                    │ totalDiscount         │    │
                    │ billDiscount          │    │
                    │ billDiscountType      │    │
                    │ billDiscountValue     │    │
                    │ grossTotal            │    │
                    │ subTotal              │    │
                    │ gstPercent            │    │
                    │ cgst                  │    │
                    │ sgst                  │    │
                    │ igst                  │    │
                    │ totalAmount           │    │
                    │ status                │    │
                    │ paymentStatus         │    │
                    │ isInterState          │    │
                    │ createdAt             │    │
                    └───────────────────────┘    │
                               │                │
                               └────────────────┘
                          
                    Items Array Structure:
                    ┌─────────────────────────────────┐
                    │ product (FK → Product)         │
                    │ productName                     │
                    │ hsnCode                         │
                    │ quantity                        │
                    │ price                           │
                    │ discountPercent                 │
                    │ discountAmount                  │
                    │ taxableValue                    │
                    │ gstRate                         │
                    │ gstAmount                       │
                    │ stockAtBilling                  │
                    │ total                           │
                    └─────────────────────────────────┘
```

### Database Schema Details

#### 1. User Collection (`users`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Auto-generated unique identifier |
| `name` | String | Yes | User's full name |
| `email` | String | Yes | Unique email address |
| `mobile` | String | Yes | Unique mobile number |
| `password` | String | Yes | Bcrypt hashed password |
| `role` | String | No | Enum: `admin`, `cashier` (default: `cashier`) |
| `isActive` | Boolean | No | Account status (default: `true`) |
| `createdAt` | Date | Yes | Timestamp |
| `updatedAt` | Date | Yes | Timestamp |

**Indexes:** `email` (unique), `mobile` (unique)

---

#### 2. Customer Collection (`customers`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Auto-generated unique identifier |
| `name` | String | Yes | Customer's full name |
| `mobile` | String | Yes | Unique mobile number |
| `email` | String | No | Email address (unique, sparse) |
| `state` | String | Yes | State name for GST calculation (default: `Gujarat`) |
| `address` | String | No | Full address |
| `gstNumber` | String | No | GSTIN number (unique, sparse, uppercase) |
| `createdAt` | Date | Yes | Timestamp |
| `updatedAt` | Date | Yes | Timestamp |

**Indexes:** `mobile` (unique), `email` (unique, sparse), `gstNumber` (unique, sparse)

---

#### 3. Product Collection (`products`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Auto-generated unique identifier |
| `name` | String | Yes | Product name |
| `hsnCode` | String | Yes | HSN code for GST classification |
| `price` | Number | Yes | Unit price |
| `stock` | Number | No | Available quantity (default: `0`) |
| `category` | String | Yes | Product category |
| `gstRate` | Number | Yes | GST rate percentage (enum: `0,5,12,18,28`) |
| `discountPercentage` | Number | No | Default discount percentage (default: `0`) |
| `discountType` | String | No | Enum: `percentage`, `flat` (default: `percentage`) |
| `lowStockThreshold` | Number | No | Alert threshold (default: `10`) |
| `createdAt` | Date | Yes | Timestamp |
| `updatedAt` | Date | Yes | Timestamp |

**Indexes:** Default indexes on `_id`, compound index for search/sort

---

#### 4. Invoice Collection (`invoices`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Auto-generated unique identifier |
| `invoiceNumber` | String | Yes | Unique invoice number (INV-0001 format) |
| `customerName` | String | Yes | Customer name (denormalized) |
| `customerEmail` | String | No | Customer email (denormalized) |
| `createdBy` | ObjectId | Yes | FK → User (who created invoice) |
| `items` | Array | Yes | Array of line items (see below) |
| `totalDiscount` | Number | No | Total item-level discounts |
| `billDiscount` | Number | No | Total bill discount applied |
| `billDiscountType` | String | No | Enum: `percentage`, `flat` |
| `billDiscountValue` | Number | No | Actual discount value entered |
| `grossTotal` | Number | No | Total before any discounts |
| `subTotal` | Number | Yes | Taxable value after discounts |
| `gstPercent` | Number | Yes | Total GST percentage |
| `cgst` | Number | Yes | Central GST amount (intra-state) |
| `sgst` | Number | Yes | State GST amount (intra-state) |
| `igst` | Number | Yes | Integrated GST amount (inter-state) |
| `totalAmount` | Number | Yes | Final amount (subTotal + GST) |
| `status` | String | No | Enum: `Active`, `Cancelled` (default: `Active`) |
| `paymentStatus` | String | No | Enum: `Unpaid`, `Paid` (default: `Unpaid`) |
| `isInterState` | Boolean | No | Inter-state flag for IGST (default: `false`) |
| `createdAt` | Date | Yes | Timestamp |
| `updatedAt` | Date | Yes | Timestamp |

**Indexes:** `invoiceNumber` (unique), `createdBy`, `status`, compound indexes for pagination

##### Items Sub-document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product` | ObjectId | Yes | FK → Product |
| `productName` | String | Yes | Snapshot of product name at billing time |
| `hsnCode` | String | No | HSN code snapshot |
| `quantity` | Number | Yes | Quantity purchased |
| `price` | Number | Yes | Unit price at time of billing |
| `discountPercent` | Number | No | Item discount percentage |
| `discountAmount` | Number | No | Calculated discount amount |
| `taxableValue` | Number | Yes | (Price × Qty) - Discount |
| `gstRate` | Number | No | GST rate applied |
| `gstAmount` | Number | No | Calculated GST amount |
| `stockAtBilling` | Number | Yes | Stock snapshot when invoice created |
| `total` | Number | Yes | Line total (taxableValue + GST) |

---

### Relationships

1. **User → Invoice** (One-to-Many)
   - One user can create many invoices
   - Invoice stores `createdBy` reference to User

2. **Product → Invoice** (One-to-Many via items array)
   - One product can appear in many invoice line items
   - Invoice items store `product` reference to Product

3. **Customer → Invoice** (Implicit via customerName/customerEmail)
   - Customer data is denormalized in Invoice for historical accuracy
   - No direct FK relationship (customer can be deleted after invoicing)

---

### GST Calculation Logic

```
1. Intra-State (same state: Gujarat): CGST + SGST
   - CGST = (taxableValue × gstRate) / 2
   - SGST = (taxableValue × gstRate) / 2

2. Inter-State (different state): IGST
   - IGST = taxableValue × gstRate

3. Taxable Value Calculation:
   taxableValue = (price × quantity) - discountAmount

4. Discount Calculation:
   - Percentage: discountAmount = (price × quantity × discountPercent) / 100
   - Flat: discountAmount = discountPercent (flat amount)
```

