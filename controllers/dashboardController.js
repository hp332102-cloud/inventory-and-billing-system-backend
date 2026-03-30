/*const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

exports.getDashboardData = async (req, res) => {
  try {

    // Total Invoices
    const totalInvoices = await Invoice.countDocuments({
      status: "Active"
    });

    // Total Products
    const totalProducts = await Product.countDocuments();

    // Total Customers
    const totalCustomers = await Customer.countDocuments();

    // Total Sales
    const sales = await Invoice.aggregate([
      {
        $match: { status: "Active" }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalSales = sales[0]?.totalSales || 0;

    res.json({
      success: true,
      dashboard: {
        totalInvoices,
        totalProducts,
        totalCustomers,
        totalSales
      }
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};*/



//NOT WORK

/*const Invoice = require("../models/Invoice");
const Product = require("../models/Product");

// ==========================
// DASHBOARD SUMMARY
// ==========================

exports.getDashboardSummary = async (req, res) => {
  try {

    // today date
    const today = new Date();
    today.setHours(0,0,0,0);

    // total invoices
    const totalInvoices = await Invoice.countDocuments();

    // today invoices
    const todayInvoices = await Invoice.find({
      createdAt: { $gte: today }
    });

    let todaySales = 0;
    let todayGST = 0;

    todayInvoices.forEach(inv => {
      todaySales += inv.totalAmount;
      todayGST += inv.totalGST;
    });

    // total products
    const totalProducts = await Product.countDocuments();

    res.json({
      totalInvoices,
      todaySales,
      todayGST,
      totalProducts
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};*/


/*const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

exports.getDashboardData = async (req, res) => {
  try {
    // Basic counts - Ye fail nahi hone chahiye
    const totalInvoices = await Invoice.countDocuments({ status: "Active" }).catch(() => 0);
    const totalProducts = await Product.countDocuments().catch(() => 0);
    const totalCustomers = await Customer.countDocuments().catch(() => 0);

    // Sales calculate karein
    let totalSales = 0;
    try {
      const salesResult = await Invoice.aggregate([
        { $match: { status: "Active" } },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
      ]);
      if (salesResult.length > 0) totalSales = salesResult[0].totalSales;
    } catch (e) { console.log("Sales calculation error:", e.message); }

    // Recent Invoices - Agar populate error de raha hai toh bina populate ke check karein
    let recentInvoices = [];
    try {
      recentInvoices = await Invoice.find({ status: "Active" })
        //.populate("customer") // Agar error aaye toh .populate("customer") ko hata kar check karein
        .sort({ createdAt: -1 })
        .limit(5);
    } catch (e) { 
        console.log("Recent Invoices error:", e.message);
        // Fallback: Bina customer details ke fetch karein
        recentInvoices = await Invoice.find({ status: "Active" }).limit(5);
    }

    res.status(200).json({
      success: true,
      dashboard: {
        totalInvoices,
        totalProducts,
        totalCustomers,
        totalSales
      },
      recentInvoices,
      salesChart: [] // Abhi ke liye khali bhejein debugging ke liye

      
    });

  } catch (error) {
    console.error("FULL ERROR:", error); // VS CODE TERMINAL MEIN DEKHEIN
    res.status(500).json({ success: false, message: error.message });
  }
};*/


const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

exports.getDashboardData = async (req, res) => {
  try {
    // 1. Basic counts
    const totalInvoices = await Invoice.countDocuments().catch(() => 0);
    const totalProducts = await Product.countDocuments().catch(() => 0);
    const totalCustomers = await Customer.countDocuments().catch(() => 0);

    //new code for count cancel invoice 
    // 👇 NEW CODE HERE: Cancelled invoices count karne ke liye
    const cancelledInvoicesCount = await Invoice.countDocuments({ status: "Cancelled" }).catch(() => 0);

    // ... (baaki sara sales calculation aur aggregate logic same rahega)

    // 2. Total Sales Calculation
    let totalSales = 0;
    const salesResult = await Invoice.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
    ]);
    if (salesResult.length > 0) totalSales = salesResult[0].totalSales;

    // 3. Sales Chart Data (Monthly Grouping)
    const salesChart = await Invoice.aggregate([
      { $match: { status: "Active" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. GST Data for GST Chart (Isse aapka GST Pie Chart chalega)
    const gstResult = await Invoice.aggregate([
      { $match: { status: "Active" } },
      {
        $group: {
          _id: null,
          totalCGST: { $sum: "$cgst" },
          totalSGST: { $sum: "$sgst" },
          totalIGST: { $sum: "$igst" }
        }
      }
    ]);

    const gstData = gstResult.length > 0 ? gstResult[0] : { totalCGST: 0, totalSGST: 0, totalIGST: 0 };

    // 5. Recent Invoices
    const recentInvoices = await //Invoice.find({ status: "Active" })
      Invoice.find()//{}-->ka matlab he sari invoice (Active+Cancelled)
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Low stock – each product's threshold compare karo
    const lowStockProducts = await Product.find({
      $expr: { $lt: ["$stock", { $ifNull: ["$lowStockThreshold", 10] }] }
    })
    .sort({ stock: 1 }) // ascending – sabse kam stock pahle
    .limit(10).lean();

    // Final Response
    res.status(200).json({
      success: true,
      dashboard: {
        totalInvoices,
        totalProducts,
        totalCustomers,
        totalSales,
        cancelledInvoicesCount//response me data bhejna
      },
      recentInvoices,
      salesChart, // Ab ye khali nahi jayega
      gstData,     // Naya field GST chart ke liye
      lowStockProducts 
    });

  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};