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
│       Product        │        │       Customer        │        │       Invoice        │
├───────────────────���─��        ├──────────────────────┤        ├──────────────────────┤
│ _id                 │        │ _id                  │        │ _id                 │
│ name                │        │ name                 │        │ invoiceNumber       │
│ hsnCode             │        │ mobile               │        │ customerName       │
│ price               │        │ email                │        │ customerEmail     │
│ stock               │        │ state                │        │ items[]           │
│ category            │        │ address              │        │ grossTotal        │
│ gstRate             │        │ gstNumber            │        │ subTotal         │
│ discountType        │        └──────────────────────┘        │ totalDiscount     │
│ discountPercentage  │                   │                     │ billDiscount       │
│ lowStockThreshold  │               1 ▼│                     │ billDiscountType   │
└─────────────────────┘         ┌──────────────┐         │ billDiscountValue │
           │                     │  Invoice    │         │ gstPercent       │
           │                     │   Item      │         │ cgst            │
           ▼                     ├────────────┤         │ sgst            │
┌─────────────────────┐        │ _id         │         │ igst            │
│        User         │        │ product     │         │ totalAmount     │
├─────────────────────┤        │ productName │         │ status         │
│ _id                │        │ hsnCode    │         │ paymentStatus  │
│ name               │        │ quantity   │         │ isInterState  │
│ email              │        │ price      │         │ createdBy     │
│ mobile             │        │ discount%  │         │ createdAt    │
│ password           │        │ discountAmt│         └──────────────────────┘
│ role               │        │ taxableValue│
│ isActive           │        │ gstRate    │
└─────────────────────┘        │ gstAmount   │
                             │ stockAtBilling│
                             │ total      │
                             └───────────┘
```

### Database Collection Schemas

#### Product Collection (`products`)
Stores product information with HSN code, pricing, stock levels, category, GST rate, and discount configuration.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | auto | - | Unique product ID |
| `name` | String | yes | - | Product name |
| `hsnCode` | String | yes | - | HSN code for GST |
| `price` | Number | yes | - | Base selling price |
| `stock` | Number | no | 0 | Current stock quantity |
| `category` | String | yes | - | Product category |
| `gstRate` | Number | yes | 18 | GST rate (0,5,12,18,28) |
| `discountType` | String | no | "percentage" | "percentage" or "flat" |
| `discountPercentage` | Number | no | 0 | Discount value |
| `lowStockThreshold` | Number | no | 10 | Low stock alert level |
| `createdAt` | Date | auto | - | Creation timestamp |
| `updatedAt` | Date | auto | - | Update timestamp |

#### Customer Collection (`customers`)
Maintains customer records with contact details, GST number, and state for GST determination (intra-state: CGST/SGST, inter-state: IGST).

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | auto | - | Unique customer ID |
| `name` | String | yes | - | Customer full name |
| `mobile` | String | yes | unique | Mobile number |
| `email` | String | no | unique | Email address |
| `state` | String | yes | "Gujarat" | State for GST determination |
| `address` | String | no | - | Billing address |
| `gstNumber` | String | no | unique | GSTIN number |
| `createdAt` | Date | auto | - | Creation timestamp |
| `updatedAt` | Date | auto | - | Update timestamp |

#### Invoice Collection (`invoices`)
Central document storing complete invoice details with embedded line items, GST breakdown, and payment status.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | auto | - | Unique invoice ID |
| `invoiceNumber` | String | yes | unique | Auto-generated (INV-0001) |
| `customerName` | String | yes | - | Customer name (snapshot) |
| `customerEmail` | String | no | - | Customer email (snapshot) |
| `items` | Array | yes | - | Array of InvoiceItem objects |
| `grossTotal` | Number | no | 0 | Total before discounts |
| `subTotal` | Number | yes | - | Taxable amount after item disc |
| `totalDiscount` | Number | no | 0 | Total item discounts |
| `billDiscount` | Number | no | 0 | Bill-level discount amount |
| `billDiscountType` | String | no | "percentage" | "percentage" or "flat" |
| `billDiscountValue` | Number | no | 0 | Discount input value |
| `gstPercent` | Number | yes | - | Effective GST rate |
| `cgst` | Number | yes | - | CGST amount |
| `sgst` | Number | yes | - | SGST amount |
| `igst` | Number | yes | - | IGST amount |
| `totalAmount` | Number | yes | - | Final payable amount |
| `status` | String | no | "Active" | "Active" or "Cancelled" |
| `paymentStatus` | String | no | "Unpaid" | "Paid" or "Unpaid" |
| `isInterState` | Boolean | no | false | true = IGST, false = CGST/SGST |
| `createdBy` | ObjectId | yes | - | User reference |
| `createdAt` | Date | auto | - | Creation timestamp |
| `updatedAt` | Date | auto | - | Update timestamp |

#### InvoiceItem Embeddable Object
Embedded inside Invoice.items array - stores line item details at billing time.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated item ID |
| `product` | ObjectId | Product reference |
| `productName` | String | Product name (snapshot) |
| `hsnCode` | String | HSN code (snapshot) |
| `quantity` | Number | Quantity billed |
| `price` | Number | Unit price at billing |
| `discountPercent` | Number | Discount % applied |
| `discountAmount` | Number | Discount amount |
| `taxableValue` | Number | Value after discount, before GST |
| `gstRate` | Number | GST rate % |
| `gstAmount` | Number | GST amount |
| `stockAtBilling` | Number | Stock snapshot at billing |
| `total` | Number | Line item total |

#### User Collection (`users`)
Manages system users with authentication, role-based access control.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | auto | Unique user ID |
| `name` | String | yes | User's full name |
| `email` | String | yes, unique | Login email |
| `mobile` | String | yes, unique | Mobile number |
| `password` | String | yes | Bcrypt-hashed password |
| `role` | String | no | "admin" or "cashier" |
| `isActive` | Boolean | no | Account active status |

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

#### `GET /api/customers/search/:mobile`
Searches customer by mobile number.

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

