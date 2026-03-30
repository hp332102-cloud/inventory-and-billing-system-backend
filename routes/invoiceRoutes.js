
/*const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  createInvoice,
  getInvoices,
  //getCancelledInvoices,
  getInvoiceById,
  updateInvoice,
  cancelInvoice,
  getDailySalesReport,
  monthlySalesReport,
  generateInvoicePDF
} = require("../controllers/invoiceController");

// ✅ REPORT ROUTES FIRST
//daily report ---> admin only
router.get("/daily-report",auth,role("admin"), getDailySalesReport);
//monthly report -->admin only
router.get("/reports/monthly",auth,role("admin"), monthlySalesReport);

// ✅ NORMAL ROUTES
//create invoice --> admin + cashier
router.post("/",auth, createInvoice);
//get invoice-->admin + cashier
router.get("/",auth, getInvoices);

// ✅ DYNAMIC ROUTES LAST
//get single invoice -->admin+cashier
router.get("/:id",auth, getInvoiceById);

//router.get("/cancelled", auth, role("admin"), getCancelledInvoices);

//update invoice -->admin only
router.put("/:id",auth,role("admin"), updateInvoice);
//cancel Invoice --> admin only
router.patch("/:id/cancel",auth,role("admin"), cancelInvoice);
//pdf ---> admin  + cashier 
router.get("/invoice/:id/pdf",auth, generateInvoicePDF);//pdf generation mate



module.exports = router;*/



const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  createInvoice,
  getInvoices,
  getCancelledInvoices,
  getInvoiceById,
  updateInvoice,
  cancelInvoice,
  getDailySalesReport,
  monthlySalesReport,
  generateInvoicePDF,
  generateMonthlyReportPDF   // ADD THIS
} = require("../controllers/invoiceController");

// ============================
// REPORT ROUTES FIRST
// ============================

// daily report ---> admin only
router.get("/daily-report", auth, role("admin"), getDailySalesReport);

// monthly report --> admin only
router.get("/reports/monthly", auth, role("admin"), monthlySalesReport);


// ============================
// NORMAL ROUTES
// ============================

// create invoice --> admin + cashier
router.post("/", auth, createInvoice);


// get all invoices --> admin + cashier
router.get("/", auth, getInvoices);

// get cancelled invoices --> admin only
router.get("/cancelled", auth, role("admin"), getCancelledInvoices);


// ============================
// SPECIAL ROUTES
// ============================

// pdf ---> admin + cashier
router.get("/invoice/:id/pdf", auth, generateInvoicePDF);

//pdf monthly report
router.get("/reports/monthly/pdf",auth,role("admin"),generateMonthlyReportPDF);


// ============================
// DYNAMIC ROUTES LAST
// ============================

// get single invoice --> admin + cashier
router.get("/:id", auth, getInvoiceById);

// update invoice --> admin only
router.put("/:id", auth, role("admin"), updateInvoice);

// cancel Invoice --> admin only
router.patch("/:id/cancel", auth, role("admin"), cancelInvoice);


module.exports = router;
