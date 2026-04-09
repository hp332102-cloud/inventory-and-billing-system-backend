# Chapter 7: Testing

---

## 7.1 Testing and Deployment

After all designing, development, and configuration phases were completed, the Inventory and Billing System was subjected to a comprehensive testing process. The objective of testing was to verify that all functionalities of the system — including product management, customer management, invoice generation, GST calculations, PDF export, and report generation — worked as expected and met the project requirements.

The testing was carried out in multiple stages, covering API testing using Postman, functional testing of all modules, design and UI testing, and flow testing. Both individual components and the integrated system were tested to ensure reliability, correctness, and a smooth user experience across all roles (Admin and Cashier).

Following successful testing and verification, the application was deployed using a split-hosting approach:

- **Frontend (React)** was deployed on Vercel.
- **Backend (Node. js + Express)** was deployed on Render.
- **Database (MongoDB)** was migrated to MongoDB Atlas cloud for persistent production storage.

Post-deployment testing was also conducted in the live environment to confirm that all features functioned correctly in production.

---

## 7.2 API Testing using Postman

API testing was performed using Postman, which was the primary tool for verifying all backend REST API endpoints. Each endpoint was tested individually by sending HTTP requests with appropriate headers, request bodies, and authentication tokens. The responses were examined for correct status codes, expected data, and proper error messages.

The following aspects were verified during API testing:

- Correct HTTP status codes (200, 201, 400, 401, 403, 404, etc.)
- Accurate response data structures (JSON format)
- JWT token-based authentication and authorization for protected routes
- Role-based access control (Admin vs. Cashier permissions)
- GST calculation logic — CGST/ SGST for intra-state and IGST for inter-state invoices
- PDF generation endpoints for invoices and reports
- Proper error handling for invalid inputs and unauthorized access

---

### Table 7.2.1: API Test Cases and Results

┌────┬────────────────────────────┬──────────────────────────────────┬───────────────────────────────────┬────────────────┬────────┐
│ No │ API Endpoint              │ Test Case/Input                  │ Expected Output                   │ Result         │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 1  │ POST /api/users/register  │ Register new user with name,     │ 201 Created – User registered     │ Pass           │        │
│    │                          │ email, mobile, password, role    │                                   │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 2  │ POST /api/users/login     │ Login with valid email and       │ 200 OK – JWT token returned with  │ Pass           │        │
│    │                          │ password credentials              │ user info                         │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 3  │ POST /api/users/login     │ Login with invalid / wrong       │ 401 Unauthorized – Invalid        │ Pass           │        │
│    │                          │ password credentials              │ credentials                       │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 4  │ GET /api/products         │ Fetch all products with valid    │ 200 OK – List of all products     │ Pass           │        │
│    │                          │ JWT token in header               │ returned                          │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 5  │ POST /api/products        │ Add new product (name, price,    │ 201 Created – Product added to    │ Pass           │        │
│    │                          │ stock, HSN, gstRate) as Admin     │ database                          │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 6  │ POST /api/products        │ Add product without JWT token    │ 401 Unauthorized – Token          │ Pass           │        │
│    │                          │ (unauthorized request)            │ missing/invalid                   │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 7  │ PUT /api/products/:id     │ Update product price and stock   │ 200 OK – Product updated          │ Pass           │        │
│    │                          │ quantity by product ID            │ successfully                      │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 8  │ DELETE /api/products/:id  │ Delete product by ID using       │ 200 OK – Product deleted          │ Pass           │        │
│    │                          │ Admin role token                  │                                   │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 9  │ DELETE /api/products/:id  │ Attempt to delete product using  │ 403 Forbidden – Access denied     │ Pass           │        │
│    │                          │ Cashier role token                │                                   │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 10 │ POST /api/customers/add   │ Add new customer with name,      │ 201 Created – Customer saved in   │ Pass           │        │
│    │                          │ mobile, email, address            │ database                          │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 11 │ GET /api/customers        │ Get all customers with valid     │ 200 OK – Customer list returned   │ Pass           │        │
│    │                          │ authentication token              │                                   │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 12 │ GET /api/customers/       │ Search customer by mobile        │ 200 OK – Matching customer        │ Pass           │        │
│    │ search/:mobile            │ number                            │ returned                          │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 13 │ GET /api/customers/       │ Search with non-existent mobile  │ 404 Not Found – No customer       │ Pass           │        │
│    │ search/:mobile            │ number                            │ found                             │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 14 │ PUT /api/customers/:id    │ Update customer address and      │ 200 OK – Customer details         │ Pass           │        │
│    │                          │ email details                     │ updated                           │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 15 │ DELETE /api/customers/:id │ Delete customer record using     │ 200 OK – Customer deleted         │ Pass           │        │
│    │                          │ Admin token                       │                                   │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 16 │ POST /api/invoices        │ Create invoice with products     │ 201 Created – Invoice generated   │ Pass           │        │
│    │                          │ (intra-state, CGST+SGST)          │ with GST breakup                  │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 17 │ POST /api/invoices        │ Create invoice with              │ 201 Created – Invoice with IGST  │ Pass           │        │
│    │                          │ isInterState = true (IGST        │ calculated correctly              │                │        │
│    │                          │ applies)                          │                                   │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 18 │ POST /api/invoices        │ Create invoice with product-     │ 201 Created – Discounts and      │ Pass           │        │
│    │                          │ level and bill-level discount     │ totals calculated correctly      │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 19 │ GET /api/invoices         │ Fetch all invoices with valid    │ 200 OK – All invoices listed     │ Pass           │        │
│    │                          │ JWT token                         │                                   │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 20 │ GET /api/invoices/:id     │ Fetch single invoice details by  │ 200 OK – Invoice details         │ Pass           │        │
│    │                          │ invoice ID                        │ returned                          │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 21 │ GET /api/invoices/        │ Generate and download PDF of     │ 200 OK – PDF file returned for   │ Pass           │        │
│    │ invoice/:id/pdf           │ specific invoice                  │ download                          │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 22 │ PATCH /api/invoices/:id/  │ Cancel an existing active        │ 200 OK – Invoice status changed  │ Pass           │        │
│    │ cancel                    │ invoice (Admin role)              │ to Cancelled                      │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 23 │ PATCH /api/invoices/:id/  │ Attempt to cancel invoice using  │ 403 Forbidden – Role not         │ Pass           │        │
│    │ cancel                    │ Cashier role token                │ authorized                        │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 24 │ GET /api/invoices/        │ Fetch daily sales report for a   │ 200 OK – Daily report with       │ Pass           │        │
│    │ daily-report              │ specific date (?date=)            │ invoice totals returned          │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 25 │ GET /api/invoices/        │ Fetch monthly sales and GST      │ 200 OK – Monthly report with     │ Pass           │        │
│    │ reports/monthly           │ report (?month=&year=)           │ CGST/SGST/IGST returned          │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 26 │ GET /api/invoices/        │ Download monthly report as PDF   │ 200 OK – PDF file generated and  │ Pass           │        │
│    │ reports/monthly/pdf       │                                   │ returned                          │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 27 │ GET /api/invoices/        │ Fetch list of all cancelled      │ 200 OK – Cancelled invoices      │ Pass           │        │
│    │ cancelled                 │ invoices                          │ list returned                     │                │        │
├────┼────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────┼────────┤
│ 28 │ GET /api/dashboard/stats  │ Fetch dashboard stats: total     │ 200 OK – All stats returned      │ Pass           │        │
│    │                          │ sales, invoices, low stock        │ correctly                         │                │        │
└────┴────────────────────────────┴──────────────────────────────────┴───────────────────────────────────┴────────────────┴────────┘

---

## 7.3 Functional Testing

Functional testing was performed to verify that each module of the system operates correctly as per the defined requirements. This testing focused on the behavior of the application from the end-user's perspective — verifying that inputs produce the correct outputs and that all interactions work as intended.

The following modules were tested in functional testing:

### 7.3.1 Login Module

The login module was tested to ensure that valid credentials grant access and that invalid credentials are properly rejected with meaningful error messages.

### 7.3.2 Product Management Module

The product module was tested for all CRUD operations — adding, viewing, editing, and deleting products. Validation was verified for required fields, and role-based restrictions were confirmed (Admin-only access for delete).

### 7.3.3 Customer Management Module

The customer module was tested for adding, searching, updating, and deleting customer records. The mobile number search feature was specifically tested for quick retrieval during invoice creation.

### 7.3.4 Invoice Module

The invoice module was the most critical module for testing. Tests covered intra-state and inter-state GST calculation, product-level discounts, bill-level discounts, invoice PDF generation, and invoice cancellation. GST calculation accuracy was validated for all tax slabs (0%, 5%, 12%, 18%, 28%).

### 7.3.5 Dashboard and Reports Module

The dashboard was tested to confirm that sales stats, charts, and low stock alerts are displayed correctly. Daily and monthly reports were tested for accurate data aggregation and PDF export functionality.

---

### Table 7.3.1: Functional Test Cases and Results

┌────┬─────────────────┬────────────────────────────┬─────────────────────────────────┬────────────────────────┬────────┬─────────────┐
│ No │ Module          │ Test Input                 │ Expected Output                 │ Result                │        │ Role        │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 1  │ Login Module   │ Enter correct email and    │ Dashboard loads successfully    │ Pass                  │        │ Admin/      │
│    │                │ password                   │                                 │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 2  │ Login Module   │ Enter incorrect password   │ Error: Invalid credentials      │ Pass                  │        │ Admin/      │
│    │                │                            │ shown                            │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 3  │ Login Module   │ Leave fields empty and     │ Validation error displayed      │ Pass                  │        │ Admin/      │
│    │                │ click Login                │                                 │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 4  │ Product – Add  │ Add product with all       │ Product saved, list updated     │ Pass                  │        │ Admin       │
│    │                │ required fields            │                                 │                       │        │             │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 5  │ Product – Add  │ Submit without required    │ Validation error shown          │ Pass                  │        │ Admin       │
│    │                │ field (e.g. price)         │                                 │                       │        │             │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 6  │ Product – Edit │ Modify product price and   │ Updated price reflected in list │ Pass                  │        │ Admin       │
│    │                │ save                       │                                 │                       │        │             │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 7  │ Product –      │ Delete a product           │ Product removed from list       │ Pass                  │        │ Admin       │
│    │ Delete         │                            │                                 │                       │        │             │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 8  │ Customer – Add │ Add customer with name     │ Customer saved, visible in list │ Pass                  │        │ Admin/      │
│    │                │ and mobile                 │                                 │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 9  │ Customer –     │ Search customer by mobile  │ Matching customer displayed     │ Pass                  │        │ Admin/      │
│    │ Search         │ number                     │                                 │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 10 │ Invoice –      │ Select customer, add       │ Invoice created, PDF            │ Pass                  │        │ Admin/      │
│    │ Create         │ products, generate invoice │ downloadable                    │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 11 │ Invoice – GST  │ Create intra-state invoice │ CGST and SGST split shown       │ Pass                  │        │ Admin/      │
│    │                │                            │ correctly                       │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 12 │ Invoice – GST  │ Create inter-state invoice │ IGST applied, CGST/SGST = 0     │ Pass                  │        │ Admin/      │
│    │                │ (IGST)                     │                                 │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 13 │ Invoice –      │ Apply percentage discount  │ Discounted amount calculated    │ Pass                  │        │ Admin/      │
│    │ Discount       │ on product                 │ correctly                       │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 14 │ Invoice –      │ Apply flat bill discount   │ Final total reduced correctly   │ Pass                  │        │ Admin/      │
│    │ Discount       │                            │                                 │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 15 │ Invoice – PDF  │ Click Download PDF on      │ PDF opens with all correct      │ Pass                  │        │ Admin/      │
│    │                │ invoice                    │ details                         │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 16 │ Invoice –      │ Cancel an active invoice   │ Status changes to Cancelled     │ Pass                  │        │ Admin       │
│    │ Cancel         │ (Admin)                    │                                 │                       │        │             │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 17 │ Dashboard      │ Load dashboard after login │ Cards, charts, low stock alerts │ Pass                  │        │ Admin/      │
│    │                │                            │ shown                           │                       │        │ Cashier     │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 18 │ Reports –      │ Select date and fetch      │ Report with sales data shown    │ Pass                  │        │ Admin       │
│    │ Daily          │ daily report               │ correctly                       │                       │        │             │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 19 │ Reports –      │ Select month/year for      │ Monthly GST report generated    │ Pass                  │        │ Admin       │
│    │ Monthly        │ monthly report             │                                 │                       │        │             │
├────┼─────────────────┼────────────────────────────┼─────────────────────────────────┼────────────────────────┼────────┼─────────────┤
│ 20 │ Role Access    │ Cashier tries to delete    │ Access denied message shown     │ Pass                  │        │ Cashier     │
│    │                │ product                    │                                 │                       │        │             │
└────┴─────────────────┴────────────────────────────┴─────────────────────────────────┴────────────────────────┴────────┴─────────────┘

---

## 7.4 Testing of Design and UI

Design testing focused on verifying the visual consistency, layout quality, and overall user interface of the application. The goal was to ensure that the application looked professional and was easy to navigate for users. The following elements were specifically tested:

- Overall design consistency across all pages of the application
- Responsiveness of the UI across different screen sizes — desktop, tablet, and mobile
- Correct rendering of all UI elements including buttons, forms, tables, and charts
- Real-time updates in the invoice form when products are added or modified
- Professional appearance of generated PDF invoices
- Sidebar navigation and page routing without errors

---

### Table 7.4.1: Design and UI Test Cases and Results

┌────┬───────────────────┬──────────────────────────────────┬─────────────────────────────────────┬────────────────────────┬────────┐
│ No │ Page/Module       │ What Was Tested                  │ Expected Result                     │ Result                │        │
├────┼───────────────────┼──────────────────────────────────┼─────────────────────────────────────┼────────────────────────┼────────┤
│ 1  │ Login Page        │ Layout, form alignment, and      │ Consistent and professional UI      │ Pass                  │        │
│    │                   │ button styling                    │                                     │                       │        │
├────┼───────────────────┼──────────────────────────────────┼─────────────────────────────────────┼────────────────────────┼────────┤
│ 2  │ Dashboard         │ Cards, charts, and table         │ All components rendered correctly  │ Pass                  │        │
│    │                   │ responsiveness                    │                                     │                       │        │
├────┼───────────────────┼──────────────────────────────────┼─────────────────────────────────────┼────────────────────────┼────────┤
│ 3  │ Products Page     │ Table headers, edit/delete       │ All UI elements display correctly  │ Pass                  │        │
│    │                   │ icons, pagination                 │                                     │                       │        │
├────┼───────────────────┼──────────────────────────────────┼─────────────────────────────────────┼────────────────────────┼────────┤
│ 4  │ Invoice Form      │ Real-time GST update on          │ GST value updates instantly        │ Pass                  │        │
│    │                   │ product selection                 │ without refresh                    │                       │        │
├────┼───────────────────┼──────────────────────────────────┼─────────────────────────────────────┼────────────────────────┼────────┤
│ 5  │ Invoice PDF       │ PDF layout, header, GST breakup  │ Clean, professional PDF generated  │ Pass                  │        │
│    │                   │ section                           │                                     │                       │        │
├────┼───────────────────┼──────────────────────────────────┼─────────────────────────────────────┼────────────────────────┼────────┤
│ 6  │ Responsiveness    │ Test all pages on mobile and     │ UI adjusts correctly for all       │ Pass                  │        │
│    │                   │ tablet screens                    │ screen sizes                       │                       │        │
├────┼───────────────────┼──────────────────────────────────┼─────────────────────────────────────┼────────────────────────┼────────┤
│ 7  │ Navigation        │ Sidebar links and page routing   │ All pages navigate correctly       │ Pass                  │        │
│    │                   │                                   │ without error                      │                       │        │
├────┼───────────────────┼──────────────────────────────────┼─────────────────────────────────────┼────────────────────────┼────────┤
│ 8  │ Error Messages    │ Form validation error display    │ Errors shown clearly with proper   │ Pass                  │        │
│    │                   │ style                             │ styling                            │                       │        │
└────┴───────────────────┴──────────────────────────────────┴─────────────────────────────────────┴────────────────────────┴────────┘

---

## 7.5 Testing the Flow of the Website

Flow testing was carried out to ensure that the overall navigation and workflow of the application are smooth and logical. All pages and modules must be properly linked with correct navigation paths to provide a seamless user experience.

The following workflows were tested:

### 7.5.1 Invoice Creation Workflow

The complete invoice creation flow was tested end-to-end:

- Login to system → Navigate to New Invoice
- Search and select customer → Add products from inventory
- Verify real-time GST calculation → Apply discounts
- Generate invoice → Download PDF → Verify stock reduction

### 7.5.2 Admin vs. Cashier Workflow

The role-based navigation flow was tested to confirm that Cashiers are restricted from admin-only pages (product deletion, invoice cancellation, reports) and are redirected or shown access denied messages appropriately.

### 7.5.3 Report Generation Workflow

The report generation flow was tested to ensure: navigation to Reports page → selection of report type → date range input → data display → PDF download. All steps executed without errors.

### 7.5.4 Post-Deployment End-to-End Testing

After deploying the application on Vercel (frontend) and Render (backend) with MongoDB Atlas (database), end-to-end testing was performed in the live production environment. All features — invoice generation, GST calculation, PDF export, and authentication — were verified to work correctly in production. Post-deployment bugs were identified, resolved, and the codebase was documented and made production-ready.

---

## Summary

In summary, the Inventory and Billing System successfully passed all testing phases including API testing via Postman, functional testing, design and UI testing, and flow testing. The system was found to be reliable, accurate in GST computations, secure in authentication, and user-friendly for both Admin and Cashier roles.

(End of Chapter 7)
