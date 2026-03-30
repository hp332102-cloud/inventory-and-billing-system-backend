const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const generateInvoiceNumber = require("../utils/generateInvoiceNumber");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");



// const COMPANY_STATE = "Gujarat"


// ==========================
// CREATE INVOICE (with product name & stock info)
// ==========================

exports.createInvoice = async (req, res) => {
  try {
    // 1. Frontend se data lein (Make sure billDiscount bhi destructure ho)
    const { customerId, customerName, customerEmail, items, billDiscountValue, billDiscountType } = req.body;

    if (!customerId) return res.status(400).json({ message: "customerId is required" });

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Invoice items required" });
    }

    const customer = await Customer.findById(customerId);
    if(!customer) return res.status(404).json({message:"Customer not found"});

    const COMPANY_STATE = "Gujarat";
    const isInterState = customer.state ? customer.state.toLowerCase() !== COMPANY_STATE.toLowerCase() : false;

    // Variables initialize karein
    let totalSubTotal = 0;      
    let totalDiscountAmount = 0; 
    let totalTaxableAmount = 0;  
    let totalGstAmount = 0;
    const processedItems = [];

    // 2. Loop chalakar pehle items process karein
    // for (const item of items) {
    //   const product = await Product.findById(item.product);
    //   if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
    //   if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

    //   const rawAmount = product.price * item.quantity;
      
    //   const discountPercent = item.discountPercent || product.discountPercentage || 0;
    //   const discountAmount = (rawAmount * discountPercent) / 100;
    //   const taxableValue = rawAmount - discountAmount;
    //   const gstRate = product.gstRate || 0;
    //   const itemGstAmount = taxableValue * (gstRate / 100);
    //   const itemFinalTotal = taxableValue + itemGstAmount;

    //   totalSubTotal += rawAmount;
    //   totalDiscountAmount += discountAmount;
    //   totalTaxableAmount += taxableValue;
    //   totalGstAmount += itemGstAmount;

    //   processedItems.push({
    //     product: product._id,
    //     productName: product.name,
    //     hsnCode: product.hsnCode || "N/a",
    //     quantity: item.quantity,
    //     price: product.price,
    //     discountPercent,
    //     discountAmount,
    //     taxableValue,
    //     gstRate,
    //     gstAmount: itemGstAmount,
    //     stockAtBilling: product.stock,
    //     total: itemFinalTotal,
    //   });

    //   // Avoid full document validation (e.g. missing hsnCode on old products) by using $inc
    //   await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    // }

    // 2. Loop chalakar pehle items process karein
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

      const rawAmount = product.price * item.quantity;
      
      // ✨ YAHAN CHANGE HAI: Item-wise Discount Type check karein
      // Frontend se item.discountType bhejiyega (e.g., "percent" ya "fixed")
      const dType = item.discountType || product.discountType || "percentage";
      const dVal = item.discountPercent || product.discountPercentage || 0;

      let discountAmount = 0;
      if (dType === "percentage") {
        discountAmount = (rawAmount * dVal) / 100;
      } else {
        // Agar flat hai toh direct wahi amount
        discountAmount = dVal; 
      }

      const taxableValue = rawAmount - discountAmount;
      const gstRate = product.gstRate || 0;
      const itemGstAmount = taxableValue * (gstRate / 100);
      const itemFinalTotal = taxableValue + itemGstAmount;

      totalSubTotal += rawAmount;
      totalDiscountAmount += discountAmount;
      totalTaxableAmount += taxableValue;
      totalGstAmount += itemGstAmount;

      processedItems.push({
        product: product._id,
        productName: product.name,
        hsnCode: product.hsnCode || "N/a",
        quantity: item.quantity,
        price: product.price,
        discountPercent: dType === "percent" ? dVal : 0, // Info ke liye
        discountAmount, 
        taxableValue,
        gstRate,
        gstAmount: itemGstAmount,
        stockAtBilling: product.stock,
        total: itemFinalTotal,
      });

      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    // // 3. ✨ BILL DISCOUNT LOGIC (Applied post-March 24, 2026 logic)
    // let finalBillDiscount = Number(billDiscount) || 0;
    
    // // Automatic 5% discount for bills >= 50,000 (New logic era)
    // const DISCOUNT_CUTOFF_DATE = new Date("2026-03-24T00:00:00.000Z");
    // const isNewInvoiceEra = new Date() >= DISCOUNT_CUTOFF_DATE;

    // if (isNewInvoiceEra && finalBillDiscount === 0 && totalTaxableAmount >= 50000) {
    //   finalBillDiscount = (totalTaxableAmount * 5) / 100;
    // }

    // // Taxable value ko update karein discount ke baad
    // const finalTaxableValue = totalTaxableAmount - finalBillDiscount;
    

    // 3. ✨ NEW BILL DISCOUNT LOGIC
    let finalBillDiscount = 0;
    const val = Number(billDiscountValue) || 0;

    if (billDiscountType === "percentage") {
        const pVal = Math.min(val, 100); // Cap at 100%
        finalBillDiscount = (totalTaxableAmount * pVal) / 100;
    } else {
        finalBillDiscount = val;
    }

    // Validation: Discount taxable value se zyada na ho
    if (finalBillDiscount > totalTaxableAmount) finalBillDiscount = totalTaxableAmount;

    // Taxable value ko update karein
    const finalTaxableValue = totalTaxableAmount - finalBillDiscount;
    // GST ko proportionaly adjust karein (kyunki discount ke baad GST kam ho jata hai)
    const adjustedGst = (finalBillDiscount > 0 && totalTaxableAmount > 0)
      ? totalGstAmount * (finalTaxableValue / totalTaxableAmount) 
      : totalGstAmount;

    let cgst = 0, sgst = 0, igst = 0;
    if (isInterState) {
      igst = +adjustedGst.toFixed(2);
    } else {
      cgst = +(adjustedGst / 2).toFixed(2);
      sgst = +(adjustedGst / 2).toFixed(2);
    }

    const finalGrandTotal = +(finalTaxableValue + adjustedGst).toFixed(2);
    const invoiceNumber = await generateInvoiceNumber();

    // 4. Database mein save karein
    const invoice = await Invoice.create({
      invoiceNumber,
      customerName,
      customerEmail,
      items: processedItems,
      grossTotal: +totalSubTotal.toFixed(2),
      subTotal: +finalTaxableValue.toFixed(2), // Final Taxable Amount
      gstPercent: processedItems.every(i => i.gstRate === processedItems[0].gstRate) ? processedItems[0].gstRate : 0, 
      totalDiscount: +totalDiscountAmount.toFixed(2), // Item wise
      billDiscount: +finalBillDiscount.toFixed(2),    // Extra bill discount
      billDiscountValue: val,
      billDiscountType: billDiscountType || "percentage",
      cgst,
      sgst,
      igst,
      totalAmount: finalGrandTotal,
      isInterState,
      status: "Active",
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating invoice",
      error: error.message,
    });
  }
};


/*exports.createInvoice = async (req, res) => {
  try {
    const { customerName, customerEmail, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Invoice items required" });
    }

    let subTotal = 0;
    let totalDiscount = 0; //Subtotal-Discount
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${item.product}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }

      const rawTotal = product.price * item.quantity;


      const total = product.price * item.quantity;
      subTotal += total;

      const gstRate = product.gstRate || 0;
      const itemGstAmount = total * (gstRate / 100);

      // 🔥 Store snapshot data
      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        gstRate,
        gstAmount: itemGstAmount,
        stockAtBilling: product.stock,
        total,
      });

      // 🔥 Reduce stock automatically
      product.stock -= item.quantity;
      await product.save();
    }

    // ================= GST Calculation =================
    // We sum up the exact GST amounts from each item instead of a flat rate.
    const totalGst = processedItems.reduce((acc, item) => acc + item.gstAmount, 0);
    const cgst = +(totalGst / 2).toFixed(2);
    const sgst = +(totalGst / 2).toFixed(2);
    const igst = 0;

    const totalAmount = +(subTotal + cgst + sgst).toFixed(2);

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      customerName,
      customerEmail,
      items: processedItems,
      subTotal,
      gstPercent: 0, // Deprecated, kept for schema compat. Handled dynamically now.
      cgst,
      sgst,
      igst,
      totalAmount,
      status: "Active",
      paymentStatus: "Unpaid",

      //import line 
      createdBy : req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating invoice",
      error: error.message,
    });
  }
};*/


// ==========================
// GET ALL INVOICES (Pagination + Search + Sort)only active vaalaa
// ==========================


exports.getInvoices = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page)) || 1;
    const limit = Math.max(1, Number(req.query.limit)) || 10; // Default limit 10 kar dein
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt"; // Default sort date par
    const order = req.query.order === "asc" ? 1 : -1;

    // 🔍 Search Query: Name, Email aur Invoice Number teeno par search karega
    const query = {
      $or: [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ],
    };

    // Agar search empty hai toh filter hata dein
    const finalQuery = search ? query : {};

    const invoices = await Invoice.find(finalQuery)
      .populate("items.product", "name price")
      .sort({ [sortBy]: order }) // ✨ Dynamic Sorting (Amount ya Date)
      .skip(skip)
      .limit(limit);

    const totalInvoices = await Invoice.countDocuments(finalQuery);

    res.json({
      success: true,
      page,
      limit,
      totalInvoices,
      totalPages: Math.ceil(totalInvoices / limit),
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// exports.getInvoices = async (req, res) => {
//   try {
//     const page = Math.max(1, Number(req.query.page)) || 1;
//     const limit = Math.max(1, Number(req.query.limit)) || 5;
//     const skip = (page - 1) * limit;

//     const search = req.query.search || "";
//     const sortBy = req.query.sortBy || "createdAt";//default sort date par
//     const order = req.query.order === "asc" ? 1 : -1;

//     const query = {
//       /*status: "Active",*/
//       $or: [
//         { invoiceNumber: { $regex: search, $options: "i" } },
//         { customerName: { $regex: search, $options: "i" } },
//         { customerEmail: { $regex: search, $options: "i" } },
//       ],
//     };

//     //search query ho ya na ho hum status filter nahi lagayenge
//     const invoices = await Invoice.find(search ? query : {})
//       .populate("items.product", "name price")
//       .sort({ [sortBy]: order })
//       .skip(skip)
//       .limit(limit);

//     const totalInvoices = await Invoice.countDocuments(search ? query : { status: "Active" });

//     res.json({
//       success: true,
//       page,
//       limit,
//       totalInvoices,
//       totalPages: Math.ceil(totalInvoices / limit),
//       data: invoices,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

//get but only cancel vala
exports.getCancelledInvoices = async (req, res) => {
  try {

    const invoices = await Invoice.find({ status: "Cancelled" })
      .populate("items.product", "name price");

    res.json({
      success: true,
      totalCancelled: invoices.length,
      data: invoices
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// GET SINGLE INVOICE
// ==========================
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      "items.product",
      "name price"
    );

    if (!invoice || invoice.status === "Cancelled")
      return res.status(404).json({ message: "Invoice not found" });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// UPDATE INVOICE
// ==========================
exports.updateInvoice = async (req, res) => {
  try {
    const { customerName, customerEmail, paymentStatus } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status === "Cancelled")
      return res.status(400).json({ message: "Cancelled invoice cannot be updated" });

    if (customerName) invoice.customerName = customerName;
    if (customerEmail) invoice.customerEmail = customerEmail;

    if (paymentStatus) {
      if (!["Paid", "Unpaid"].includes(paymentStatus))
        return res.status(400).json({ message: "Invalid payment status" });
      invoice.paymentStatus = paymentStatus;
    }

    await invoice.save();

    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// GET DAILY SALES REPORT
// ==========================
exports.getDailySalesReport = async (req, res) => {
  try {
    const date = req.query.date; // expected format: YYYY-MM-DD
    if (!date) return res.status(400).json({ message: "Date is required" });

    const start = new Date(date + "T00:00:00.000Z");
    const end = new Date(date + "T23:59:59.999Z");

    const invoices = await Invoice.find({
      createdAt: { $gte: start, $lte: end },
      status: "Active",
    }).populate("items.product", "name price");

    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    res.json({
      success: true,
      date,
      totalInvoices: invoices.length,
      totalSales,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================
// MONTHLY SALES + GST REPORT
// =============================


/*exports.monthlySalesReport = async (req, res) => {
  try {
    //get month and year from query params
    const { month, year } = req.query;
    //validate input
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and Year are required"
      });
    }
    //convert month &year to numbers
    //js months are 0 based (jan=0,feb=1)
    const monthNumber = Number(month) - 1; // JS month 0 based
    const yearNumber = Number(year);

    // ✅ UTC based dates-----using UTC to avoid timezoneissues
    const startDate = new Date(Date.UTC(yearNumber, monthNumber, 1));
    const endDate = new Date(Date.UTC(yearNumber, monthNumber + 1, 1));

    //mongoDB Aggregation Pipeline
    const result = await Invoice.aggregate([
      {
        //filter invoice for selected month
        $match: {
          createdAt: {
            $gte: startDate,//greater then or equal to start date
            $lt: endDate//less than end date
          },
          status: "Active"//ignore cancelled invoice
        }
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalTaxableAmount: { $sum: { $ifNull: ["$subTotal", 0] } },
          //Total GST = CGST+SGST+IGST
          totalGST: {
            $sum: {
              $add: [
                { $ifNull: ["$cgst", 0] },
                { $ifNull: ["$sgst", 0] },
                { $ifNull: ["$igst", 0] }
              ]
            }
          },
          totalCGST: { $sum: { $ifNull: ["$cgst", 0] } },
          totalSGST: { $sum: { $ifNull: ["$sgst", 0] } },
          totalIGST: { $sum: { $ifNull: ["$igst", 0] } }
        }
      }
    ]);

    //if no invoice found,return default zero values
    const data = result[0] || {
      totalInvoices: 0,
      totalTaxableAmount: 0,
      totalGST: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0
    };

    //send structured proffessional response
    res.status(200).json({
      success: true,
      reportType: "Monthly Sales & GST Report",
      period: {
        month: monthNumber + 1,
        year: yearNumber
      },
      summary: {
        totalInvoices: data.totalInvoices,
        totalTaxableAmount: data.totalTaxableAmount,
        totalGST: data.totalGST,
        grandTotal: data.totalTaxableAmount + data.totalGST
      },
      gstBreakdown: {
        cgst: data.totalCGST,
        sgst: data.totalSGST,
        igst: data.totalIGST
      }
    });

  } catch (error) {
    //error handling
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};*/

exports.monthlySalesReport = async (req, res) => {
  try {
    const { month, year, startDate: qStartDate, endDate: qEndDate } = req.query;

    let finalStartDate, finalEndDate;
    let periodInfo = {};

    if (qStartDate && qEndDate) {
      finalStartDate = new Date(qStartDate + "T00:00:00.000Z");
      finalEndDate = new Date(qEndDate + "T23:59:59.999Z");
      periodInfo = { startDate: qStartDate, endDate: qEndDate };
    } else if (month && year) {
      const monthNumber = Number(month) - 1;
      const yearNumber = Number(year);
      finalStartDate = new Date(Date.UTC(yearNumber, monthNumber, 1));
      finalEndDate = new Date(Date.UTC(yearNumber, monthNumber + 1, 1));
      periodInfo = { month: monthNumber + 1, year: yearNumber };
    } else {
      return res.status(400).json({
        success: false,
        message: "Month/Year or StartDate/EndDate are required"
      });
    }

    // ✅ GET INVOICES LIST
    const invoices = await Invoice.find({
      createdAt: {
        $gte: finalStartDate,
        $lt: finalEndDate
      },
      status: "Active"
    })
    .sort({ createdAt: -1 })
    .select(
      "invoiceNumber customerName subTotal cgst sgst igst totalAmount totalDiscount billDiscount createdAt"
    );

    // ✅ CALCULATE SUMMARY FROM INVOICES
    let totalInvoices = invoices.length;
    let totalTaxableAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalDiscount = 0;

    invoices.forEach(inv => {
      totalTaxableAmount += inv.subTotal || 0;
      totalCGST += inv.cgst || 0;
      totalSGST += inv.sgst || 0;
      totalIGST += inv.igst || 0;
      totalDiscount += (inv.totalDiscount || 0) + (inv.billDiscount || 0);
    });

    const totalGST = totalCGST + totalSGST + totalIGST;

    // ✅ FINAL RESPONSE
    res.status(200).json({
      success: true,
      reportType: "Sales & GST Report",
      period: periodInfo,
      summary: {
        totalInvoices,
        totalTaxableAmount,
        totalDiscount,
        totalGST,
        grandTotal: totalTaxableAmount + totalGST
      },
      gstBreakdown: {
        cgst: totalCGST,
        sgst: totalSGST,
        igst: totalIGST
      },
      invoices: invoices
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================
// MONTHLY REPORT PDF GENERATOR
// =============================
//controller function 
exports.generateMonthlyReportPDF = async (req, res) => {
  try {

    const { month, year, startDate: qStartDate, endDate: qEndDate } = req.query;

    let finalStartDate, finalEndDate;

    if (qStartDate && qEndDate) {
      finalStartDate = new Date(qStartDate + "T00:00:00.000Z");
      finalEndDate = new Date(qEndDate + "T23:59:59.999Z");
    } else if (month && year) {
      const monthNumber = Number(month) - 1;
      const yearNumber = Number(year);
      finalStartDate = new Date(Date.UTC(yearNumber, monthNumber, 1));
      finalEndDate = new Date(Date.UTC(yearNumber, monthNumber + 1, 1));
    } else {
      return res.status(400).json({
        success: false,
        message: "Month/Year or StartDate/EndDate are required"
      });
    }

    // aggregation same as monthlySalesReport(data calculation karna)
    const result = await Invoice.aggregate([
      {
        //filter invoice
        $match: {
          createdAt: { $gte: finalStartDate, $lt: finalEndDate },
          status: "Active"
        }
      },
      {
        //total calculation karna
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalTaxableAmount: { $sum: "$subTotal" },
          totalCGST: { $sum: "$cgst" },
          totalSGST: { $sum: "$sgst" },
          totalIGST: { $sum: "$igst" },
          totalDiscount: { $sum: "$totalDiscount" },
          billDiscount: { $sum: "$billDiscount" }
        }
      }
    ]);

    //default value set karna (koi value na ho to 0 define karke error ko rokta he)
    const data = result[0] || {
      totalInvoices: 0,
      totalTaxableAmount: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalDiscount: 0,
      billDiscount: 0
    };

    const totalGST =
      data.totalCGST +
      data.totalSGST +
      data.totalIGST;

    const grandTotal =
      data.totalTaxableAmount +
      totalGST;

    // create folder(ye folder path banata he)
    const uploadDir = path.join(__dirname, "../uploads/reports");

    //agar folder exist nahi karta to create karenga
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = qStartDate && qEndDate 
      ? `sales-report-${qStartDate}-to-${qEndDate}.pdf`
      : `monthly-report-${month}-${year}.pdf`;

    const filePath =
      path.join(uploadDir, fileName);

    const doc = new PDFDocument({ margin: 50 });

    const writeStream =
      fs.createWriteStream(filePath);//file stream cerate karana(pdf ko file me save karta he)

    doc.pipe(writeStream);//pdf ko file se connect karna means pdf content file write hona start karega

    // =====================
    // PDF CONTENT
    // =====================

    doc.fontSize(20)
      .text("SALES & GST REPORT", { align: "center" });

    doc.moveDown();

    doc.fontSize(12);

    if (qStartDate && qEndDate) {
      doc.text(`From: ${qStartDate}`);
      doc.text(`To: ${qEndDate}`);
    } else {
      doc.text(`Month: ${month}`);
      doc.text(`Year: ${year}`);
    }

    doc.moveDown();

    doc.text(`Total Invoices: ${data.totalInvoices}`);

    doc.text(
      `Taxable Amount: INR ${data.totalTaxableAmount.toFixed(2)}`
    );

    doc.text(
      `Total Discount: INR ${(data.totalDiscount + data.billDiscount).toFixed(2)}`
    );

    doc.text(
      `CGST: INR ${data.totalCGST.toFixed(2)}`
    );

    doc.text(
      `SGST: INR ${data.totalSGST.toFixed(2)}`
    );

    doc.text(
      `IGST: INR ${data.totalIGST.toFixed(2)}`
    );

    doc.text(
      `Total GST: INR ${totalGST.toFixed(2)}`
    );

    doc.moveDown();

    doc.fontSize(14)
      .text(
        `Grand Total: INR ${grandTotal.toFixed(2)}`
      );

    // =====================
    // DETAILED TABLE
    // =====================
    const invoices = await Invoice.find({
      createdAt: { $gte: finalStartDate, $lt: finalEndDate },
      status: "Active"
    }).sort({ createdAt: 1 });

    if (invoices.length > 0) {
      // ✅ No addPage() here – table starts immediately after summary on page 1
      doc.moveDown(1.5);
      doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(14).font("Helvetica-Bold").text("Detailed Transaction History", { align: "center" });
      doc.moveDown(0.8);

      const colNo = 40;
      const colInv = 60;
      const colCust = 145;
      const colTax = 255;
      const colDisc = 315;
      const colGST = 370;
      const colTotal = 435;
      const colDate = 500;

      // Table Header
      const headerY = doc.y;
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("No", colNo, headerY);
      doc.text("Invoice #", colInv, headerY);
      doc.text("Customer", colCust, headerY);
      doc.text("Taxable", colTax, headerY);
      doc.text("Disc", colDisc, headerY);
      doc.text("GST", colGST, headerY);
      doc.text("Total", colTotal, headerY);
      doc.text("Date", colDate, headerY);

      doc.moveTo(colNo, headerY + 14).lineTo(560, headerY + 14).stroke();

      let y = headerY + 24;
      doc.font("Helvetica").fontSize(9);

      invoices.forEach((inv, index) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
        }

        const totalDiscount = (inv.totalDiscount || 0) + (inv.billDiscount || 0);
        const totalGST = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);

        doc.text(index + 1, colNo, y);
        doc.text(inv.invoiceNumber, colInv, y);
        doc.text(inv.customerName.substring(0, 14), colCust, y);
        doc.text(inv.subTotal.toFixed(2), colTax, y);
        doc.text(totalDiscount.toFixed(2), colDisc, y);
        doc.text(totalGST.toFixed(2), colGST, y);
        doc.text(inv.totalAmount.toFixed(2), colTotal, y);
        doc.text(new Date(inv.createdAt).toLocaleDateString(), colDate, y);

        y += 20;
      });

      doc.moveTo(colNo, y).lineTo(560, y).stroke();
    }

    doc.end();

    writeStream.on("finish", () => {

      res.json({
        success: true,
        message: "Monthly PDF generated",
        file: `/uploads/reports/${fileName}`
      });

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// ==========================
// CANCEL INVOICE (Restore Stock)
// ==========================
exports.cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status === "Cancelled")
      return res.status(400).json({ message: "Invoice already cancelled" });

    // Restore stock
    for (const item of invoice.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    // Update the invoice status without triggering full document validation
    // This prevents 500 errors on old invoices that lack newer schema required fields (like createdBy)
    await Invoice.updateOne({ _id: req.params.id }, { $set: { status: "Cancelled" } });

    res.json({
      success: true,
      message: "Invoice cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// PDF Generator
// ==========================

// ===============================
// Amount in Words Function
// ===============================
function numberToWords(amount) {

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
    "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertHundreds(num) {

    let str = "";

    if (num > 99) {
      str += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num > 19) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }

    if (num > 0) {
      str += ones[num] + " ";
    }

    return str.trim();
  }

  function convert(num) {

    if (num === 0) return "Zero";

    let result = "";

    const crore = Math.floor(num / 10000000);
    num %= 10000000;

    const lakh = Math.floor(num / 100000);
    num %= 100000;

    const thousand = Math.floor(num / 1000);
    num %= 1000;

    const hundred = num;

    if (crore) result += convertHundreds(crore) + " Crore ";
    if (lakh) result += convertHundreds(lakh) + " Lakh ";
    if (thousand) result += convertHundreds(thousand) + " Thousand ";
    if (hundred) result += convertHundreds(hundred);

    return result.trim();
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = convert(rupees) + " Rupees";
  if (paise > 0) {
    result += " and " + convert(paise) + " Paise";
  }
  return result + " Only";
}




/*exports.generateInvoicePDF = async (req, res) => {
  try {
    //invoice database se fetch karna
    const invoice = await Invoice.findById(req.params.id).populate("items.product");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    //upload folder check
    const uploadDir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    //file name and path
    const fileName = `invoice-${invoice.invoiceNumber}.pdf`;//file name banana(pdf ka naam dynamic bana rahe)
    const filePath = path.join(uploadDir, fileName);

    //pdf document banana
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);//pdf file me data likhne k liye

    doc.pipe(writeStream);//pdf content ko file me bhejana start

    //pdf content section
    // =========================
    // HEADER
    // =========================

    doc.fontSize(22).text("Limited pvt.ltd",40,40, { align: "center" });
    doc.fontSize(10).text("Navsari A1 City", { align: "center" });
    doc.text("GSTIN: 220022AAAAA000000A107031", { align: "center" })

    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    //invoice detail
    doc.text(`Invoice No: ${invoice.invoiceNumber}`);//invoice number print kar raha he
    doc.text(`Customer: ${invoice.customerName}`);
    doc.text(`Email: ${invoice.customerEmail || "-"}`);
    doc.text(`Date: ${invoice.createdAt.toDateString()}`);//invoice ki date sho kar raha he
    doc.moveDown();

    // =========================
    // ITEMS TABLE
    // =========================


    let tableTop = 200;
    let itemY = tableTop;

    // Table Header
    doc.fontSize(12).font("Helvetica-Bold");

    doc.text("Item", 40, itemY);//item collumn 40px se start
    doc.text("Qty", 300, itemY);
    doc.text("Price", 350, itemY);
    doc.text("Total", 450, itemY);

    // Header Line draw(horizontal line)
    doc.moveTo(40, itemY + 15)
      .lineTo(550, itemY + 15)
      .stroke();

    itemY += 25;

    // Table Rows
    doc.font("Helvetica");
    //item loop(har product k liye row banayenge)
    invoice.items.forEach((item) => {

      const name = item.productName || item.product?.name || "N/A";

      doc.text(name, 40, itemY, { width: 240 }); // width important for long names
      doc.text(item.quantity.toString(), 300, itemY);
      doc.text(`INR ${item.price.toFixed(2)}`, 350, itemY);//price 2 decimal me show
      doc.text(`INR ${item.total.toFixed(2)}`, 450, itemY);

      itemY += 25;//har row k bad neeche move karo
    });

    // Bottom Line
    doc.moveTo(40, itemY)
      .lineTo(550, itemY)
      .stroke();

    itemY += 20;
    
    // =========================
    // TAX SUMMARY (RIGHT SIDE)
    // =========================

    let summaryTop = itemY + 20; // ✅ FIXED(table k neeche 20px gap k baad summary start)
    let summaryX = 350;

    doc.font("Helvetica");

    doc.text(`Subtotal:`, summaryX, summaryTop);
    doc.text(`INR ${invoice.subTotal.toFixed(2)}`, 450, summaryTop);

    summaryTop += 20;

    //GST heading
    doc.font("Helvetica-Bold");
    doc.text(`Total GST:`,summaryX,summaryTop);
    summaryTop +=20;
    doc.font("Helvetica");
    
    //IGST OR CGST SGST
    if (invoice.igst > 0) {

      doc.text(`IGST (${invoice.gstPercent}%):`, summaryX, summaryTop);
      doc.text(`INR ${invoice.igst.toFixed(2)}`, 450, summaryTop);

    } else {

      doc.text(`CGST (${invoice.gstPercent / 2}%):`, summaryX, summaryTop);
      doc.text(`INR ${invoice.cgst.toFixed(2)}`, 450, summaryTop);

      summaryTop += 20;

      doc.text(`SGST (${invoice.gstPercent / 2}%):`, summaryX, summaryTop);
      doc.text(`INR ${invoice.sgst.toFixed(2)}`, 450, summaryTop);
    }

    //total line
    summaryTop += 25;

    doc.moveTo(summaryX, summaryTop)
      .lineTo(550, summaryTop)
      .stroke();

    summaryTop += 10;

    //grand total box
    doc.font("Helvetica-Bold");
    doc.fontSize(14);

    // 🔹 Box Draw Kar Rahe Hain (x, y, width, height)(Grand total box)
    //doc.rect(summaryX - 10, summaryTop - 5, 210, 30).stroke();

    doc.rect(summaryX - 10, summaryTop - 5, 210, 30)
      .fillAndStroke("#f5f5f5", "#000000");

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("black");


    //total label
    doc.text(`Total Amount:`, summaryX, summaryTop);
    //total value right align
    doc.text(`INR ${invoice.totalAmount.toFixed(2)}`, 450, summaryTop,{
      width: 120,
      align: "left"
    });

    //Amount in words
     summaryTop += 50;

    const words =
      numberToWords(invoice.totalAmount);

    doc.fontSize(11);

    doc.font("Helvetica-Bold");

    doc.text(
      "Amount in Words:",
      40,
      summaryTop
    );

    doc.font("Helvetica");

    doc.text(
      words,
      40,
      summaryTop + 15,
      { width: 500 }
    );


    // =========================
    // STATUS
    // =========================

    summaryTop += 40;

    doc.font("Helvetica");
    doc.fontSize(11);

    doc.text(`Status: ${invoice.status}`, summaryX, summaryTop);
    doc.text(`Payment Status: ${invoice.paymentStatus}`, summaryX, summaryTop + 20);

   
    // ✅ VERY IMPORTANT(pdf complete karne k liye mandatory)
    doc.end();

    //response
    writeStream.on("finish", () => {
      res.json({
        success: true,
        message: "Invoice PDF generated successfully",
        file: `/uploads/${fileName}`,
      });
    });

    writeStream.on("error", (err) => {
      console.error(err);
      res.status(500).json({ message: "Error generating PDF" });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};*/


// exports.generateInvoicePDF = async (req, res) => {
//   try {

//     const invoice = await Invoice.findById(req.params.id);

//     if (!invoice) {
//       return res.status(404).json({
//         message: "Invoice not found"
//       });
//     }

//     // ✅ important headers
//     res.writeHead(200, {
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `inline; filename=${invoice.invoiceNumber}.pdf`
//     });

//     // ✅ create pdf
//     const doc = new PDFDocument({ margin: 40 });

//     // ✅ pipe FIRST
//     doc.pipe(res);

//     // =====================
//     // COMPANY
//     // =====================

//     doc.fontSize(20).text("My Company", 40, 40);
//     doc.fontSize(12).text("Ahmedabad, Gujarat");
//     doc.text("Phone: 9876543210");

//     doc.moveDown();

//     // =====================
//     // INVOICE INFO
//     // =====================

//     doc.fontSize(16).text("TAX INVOICE");

//     doc.fontSize(12).text(`Invoice No: ${invoice.invoiceNumber}`);
//     doc.text(`Customer: ${invoice.customerName}`);
//     doc.text(`Email: ${invoice.customerEmail}`);

//     doc.moveDown();

//     // =====================
//     // ITEMS
//     // =====================

//     /*invoice.items.forEach((item, index) => {

//       doc.text(
//         `${index + 1}. ${item.name} | Qty: ${item.quantity} | ₹${item.totalPrice}`
//       );

//     });*/

//     // =====================
//     // TABLE HEADER
//     // =====================

//     let tableTop = 200;

//     doc.fontSize(12).font("Helvetica-Bold");

//     doc.text("No", 40, tableTop);
//     doc.text("Product", 80, tableTop);
//     doc.text("Qty", 300, tableTop);
//     doc.text("Price", 360, tableTop);
//     doc.text("Total", 450, tableTop);

//     doc.moveTo(40, tableTop + 15)
//       .lineTo(550, tableTop + 15)
//       .stroke();

//     doc.font("Helvetica");

//     let y = tableTop + 30;


//     // =====================
//     // TABLE ROWS
//     // =====================

//     invoice.items.forEach((item, index) => {

//       const productName =
//         item.productName ||
//         item.name ||
//         item.product?.name ||
//         "N/A";

//       const price =
//         item.price ||
//         item.unitPrice ||
//         0;

//       const total =
//         item.total ||
//         item.totalPrice ||
//         price * item.quantity;

//       doc.text(index + 1, 40, y);

//       doc.text(productName, 80, y);

//       doc.text(item.quantity, 300, y);

//       doc.text(`Rs.${price}`, 360, y);

//       doc.text(`Rs.${total}`, 450, y);

//       y += 25;

//     });

//     doc.moveTo(40, y)
//       .lineTo(550, y)
//       .stroke();

//     doc.moveDown();

//     // =====================
//     // TOTAL
//     // =====================

//     y += 20;

//     doc.font("Helvetica-Bold");

//     doc.text(`Subtotal: Rs.${invoice.subTotal}`, 350, y);

//     y += 20;

//     doc.text(`CGST: Rs.${invoice.cgst}`, 350, y);

//     y += 20;

//     doc.text(`SGST: Rs.${invoice.sgst}`, 350, y);

//     y += 25;

//     doc.fontSize(14);

//     doc.text(`Total: Rs.${invoice.totalAmount}`, 350, y);

//     doc.moveDown();

//     doc.text("Thank you!");

//     // ✅ VERY IMPORTANT
//     doc.end();

//     }
//     catch (error) {

//     console.log("PDF ERROR:", error);

//     res.status(500).json({
//       message: "PDF failed"
//     });

//   }
// };



/*exports.generateInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // 1. File Path Setup (Matching your server.js /uploads static config)
    const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
    const uploadPath = path.join(__dirname, '../uploads'); // Agar controllers folder me hai toh ../ use karein

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, fileName);
    const doc = new PDFDocument({ margin: 40 });

    // 2. Pipe to File Stream instead of Response
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // =====================
    // COMPANY INFO
    // =====================
    doc.fontSize(20).text("My Company", 40, 40);
    doc.fontSize(12).text("Ahmedabad, Gujarat");
    doc.text("Phone: 9876543210");
    doc.moveDown();

    // =====================
    // INVOICE INFO
    // =====================
    doc.fontSize(16).text("TAX INVOICE");
    doc.fontSize(12).text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.text(`Customer: ${invoice.customerName}`);
    doc.text(`Email: ${invoice.customerEmail}`);
    doc.moveDown();

    // =====================
    // TABLE HEADER
    // =====================
    let tableTop = 200;
    doc.fontSize(12).font("Helvetica-Bold");

    doc.text("No", 40, tableTop);
    doc.text("Product", 80, tableTop);
    doc.text("Qty", 300, tableTop);
    doc.text("Price", 360, tableTop);
    doc.text("Total", 450, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.font("Helvetica");

    let y = tableTop + 30;

    // =====================
    // TABLE ROWS (Looping through items)
    // =====================
    invoice.items.forEach((item, index) => {
      const productName = item.productName || item.name || item.product?.name || "N/A";
      const price = item.price || item.unitPrice || 0;
      const total = item.total || item.totalPrice || (price * item.quantity);

      doc.text(index + 1, 40, y);
      doc.text(productName, 80, y, { width: 210 }); // width add ki taki text wrap ho sake
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`Rs.${price}`, 360, y);
      doc.text(`Rs.${total}`, 450, y);

      y += 25;

      // Agar page khatam hone wala ho toh naya page add karne ka logic yahan aa sakta hai
    });

    doc.moveTo(40, y).lineTo(550, y).stroke();
    y += 20;

    // =====================
    // TOTALS SECTION
    // =====================
    doc.font("Helvetica-Bold");
    doc.text(`Subtotal: Rs.${invoice.subTotal}`, 350, y);
    y += 20;
    doc.text(`CGST: Rs.${invoice.cgst}`, 350, y);
    y += 20;
    doc.text(`SGST: Rs.${invoice.sgst}`, 350, y);
    y += 25;
    doc.fontSize(14);
    doc.text(`Total: Rs.${invoice.totalAmount}`, 350, y);

    doc.moveDown();
    doc.fontSize(12).text("Thank you!", 40, doc.y);

    // 3. Finalize PDF
    doc.end();

    // 4. Response after stream finishes
    stream.on('finish', () => {
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;

      res.status(200).json({
        success: true,
        message: "PDF generated successfully",
        url: fileUrl,  // Postman me ye link dikhega
        fileName: fileName
      });
    });

    stream.on('error', (err) => {
      console.error("Stream Error:", err);
      res.status(500).json({ message: "Stream Error while writing PDF" });
    });

  } catch (error) {
    console.log("PDF ERROR:", error);
    res.status(500).json({ message: "PDF generation failed" });
  }
};*/


// exports.generateInvoicePDF = async (req, res) => {
//   try {
//     const invoice = await Invoice.findById(req.params.id);
//     if (!invoice) return res.status(404).json({ message: "Invoice not found" });

//     const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
//     const uploadPath = path.join(__dirname, '../uploads');

//     if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

//     const filePath = path.join(uploadPath, fileName);
//     const doc = new PDFDocument({ margin: 40 });
//     const stream = fs.createWriteStream(filePath);
//     doc.pipe(stream);

//     // =====================
//     // COMPANY INFO & HEADER
//     // =====================
//     doc.fontSize(20).font("Helvetica-Bold").text("My Company", 40, 40);
//     doc.fontSize(10).font("Helvetica").text("Ahmedabad, Gujarat | Phone: 9876543210", 40, 65);
//     doc.fontSize(16).text("TAX INVOICE", 40, 90, { align: "right" });
//     doc.moveTo(40, 110).lineTo(550, 110).stroke();

//     // =====================
//     // INVOICE & CUSTOMER INFO
//     // =====================
//     doc.fontSize(10);
//     doc.font("Helvetica-Bold").text("Bill To:", 40, 125);
//     doc.font("Helvetica").text(`Customer: ${invoice.customerName}`, 40, 140);
//     doc.text(`Email: ${invoice.customerEmail}`, 40, 155);

//     doc.font("Helvetica-Bold").text("Invoice Details:", 350, 125);
//     doc.font("Helvetica").text(`Invoice No: ${invoice.invoiceNumber}`, 350, 140);
//     doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 350, 155);

    
//     // =====================
//     // DYNAMIC TABLE HEADER (Positions Re-aligned)
//     // =====================
//     let tableTop = 200;
//     doc.fontSize(9).font("Helvetica-Bold"); // Font size thoda chhota kiya hai spacing ke liye

//     doc.text("No", 40, tableTop, { width: 20 });
//     doc.text("Product Description", 65, tableTop, { width: 150 });
//     doc.text("Qty", 215, tableTop, { width: 30, align: "right" });
//     doc.text("Price", 250, tableTop, { width: 55, align: "right" });
//     doc.text("Disc%", 310, tableTop, { width: 40, align: "right"});
//     doc.text("GST%", 355, tableTop, { width: 40, align: "right" }); 
//     doc.text("GST Amt", 400, tableTop, { width: 65, align: "right" }); 
//     doc.text("Total", 475, tableTop, { width: 75, align: "right" });

//     doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();
//     doc.font("Helvetica");

//     let y = tableTop + 30;

//     // =====================
//     // TABLE ROWS (Fixed Overlap)
//     // =====================
//       // =====================
//     // TABLE ROWS (Updated as per your Schema)
//     // =====================
//     let overallTaxable = 0;
//     let overallGstAmount = 0;
    
//     // For extreme legacy V1 invoices where Mongoose stripped everything out and item.total == item.taxableValue
//     // Calculate global GST rate and Fallback logic
//     const totalCgstSgst = (invoice.cgst || 0) + (invoice.sgst || 0);
//     const invoiceSubtotal = invoice.subTotal || 1;
//     const globalLegacyGstRate = totalCgstSgst > 0 ? (totalCgstSgst / invoiceSubtotal) * 100 : 0;

//     invoice.items.forEach((item, index) => {
//       const productName = item.productName || "N/A";
      
//       const itemPrice = item.price || 0;
//       const qty = item.quantity || 0;
//       const rawTotal = itemPrice * qty;

//       // Taxable Value
//       const taxableValue = item.taxableValue != null ? item.taxableValue : rawTotal;

//       // Disc calculation
//       let discAmount = item.discountAmount || 0;
//       if (discAmount === 0 && rawTotal > taxableValue) {
//         discAmount = rawTotal - taxableValue;
//       }
//       let discPercent = item.discountPercent || 0;
//       if (discPercent === 0 && discAmount > 0 && rawTotal > 0) {
//         discPercent = (discAmount / rawTotal) * 100;
//       }

//       // GST calculation
//       const lineTotal = item.total != null ? item.total : taxableValue;
//       let itemGstAmount = item.gstAmount || 0;
//       if (itemGstAmount === 0 && lineTotal > taxableValue) {
//         itemGstAmount = lineTotal - taxableValue;
//       }
//       let itemGstRate = item.gstRate || 0;
//       if (itemGstRate === 0 && itemGstAmount > 0 && taxableValue > 0) {
//         itemGstRate = (itemGstAmount / taxableValue) * 100;
//       }
      
//       // Fallback for V1 legacy invoices where entirely everything was stripped and lineTotal == taxableValue
//       if (itemGstRate === 0 && itemGstAmount === 0 && globalLegacyGstRate > 0) {
//         itemGstRate = globalLegacyGstRate;
//         itemGstAmount = (taxableValue * itemGstRate) / 100;
//       }

//       overallTaxable += taxableValue;
//       overallGstAmount += itemGstAmount;

//       // Formatting text
//       const finalLineTotal = lineTotal > taxableValue ? lineTotal : (taxableValue + itemGstAmount);
      
//       const fmtDisc = typeof discPercent === 'number' ? `${discPercent.toFixed(1).replace(/\.0$/, '')}%` : "0%";
//       const fmtGst = typeof itemGstRate === 'number' ? `${itemGstRate.toFixed(1).replace(/\.0$/, '')}%` : "0%";
//       const fmtGstAmt = typeof itemGstAmount === 'number' ? itemGstAmount.toFixed(2) : "0.00";

//       // Drawing to PDF
//       doc.text(index + 1, 40, y, { width: 20 });
//       doc.text(productName, 65, y, { width: 150 });
//       doc.text(qty.toString(), 215, y, { width: 30, align: "right" });
//       doc.text(itemPrice.toFixed(2), 250, y, { width: 55, align: "right" });
//       doc.text(fmtDisc, 310, y, { width: 40, align: "right" });
//       doc.text(fmtGst, 355, y, { width: 40, align: "right" });
//       doc.text(fmtGstAmt, 400, y, { width: 65, align: "right" });
//       doc.text(finalLineTotal.toFixed(2), 475, y, { width: 75, align: "right" });

//       y += 20;
//     });

//     doc.moveTo(40, y).lineTo(550, y).stroke();
//     y += 15;

//     // Calculate effective Invoice GST Percent (for older invoices where db gstPercent = 0)
//     let effectiveGstPercent = invoice.gstPercent || 0;
//     if (effectiveGstPercent === 0 && overallTaxable > 0 && overallGstAmount > 0) {
//       effectiveGstPercent = Math.round((overallGstAmount / overallTaxable) * 100);
//     }
//     const printCgstPercent = (effectiveGstPercent / 2).toFixed(1).replace(/\.0$/, '');

//     const summaryX = 350;
//     const valueX = 475;
//     doc.font("Helvetica-Bold").fontSize(10);

//     // 1. Subtotal (Gross amount)
//     doc.text("Subtotal:", summaryX, y);
//     doc.text((invoice.subTotal || 0).toFixed(2), valueX, y, { width: 75, align: "right" });
    
//     y += 15; 
    
//     // 2. Total Discount
//     doc.fillColor("#ef4444"); 
//     doc.text("Total Discount:", summaryX, y);
//     doc.text(`- ${(invoice.totalDiscount || 0).toFixed(2)}`, valueX, y, { width: 75, align: "right" });
    
//     y += 15;
//     doc.fillColor("#000").font("Helvetica").fontSize(9);
    
//     // 3. CGST / SGST
//     doc.text(`CGST (${printCgstPercent}%):`, summaryX, y);
//     doc.text((invoice.cgst || 0).toFixed(2), valueX, y, { width: 75, align: "right" });
    
//     y += 15;
//     doc.text(`SGST (${printCgstPercent}%):`, summaryX, y);
//     doc.text((invoice.sgst || 0).toFixed(2), valueX, y, { width: 75, align: "right" });

//     y += 20;
//     // 4. Grand Total Box
//     doc.rect(summaryX - 5, y - 5, 205, 25).fill("#f1f5f9").stroke("#cbd5e1");
//     doc.fillColor("#000").fontSize(11).font("Helvetica-Bold");
//     doc.text("Grand Total:", summaryX, y);
//     doc.text((invoice.totalAmount || 0).toFixed(2), valueX, y, { width: 75, align: "right" });

//     // =====================
//     // AMOUNT IN WORDS
//     // =====================
//     y += 40;
//     doc.fontSize(10).font("Helvetica-Bold").text("Amount in Words:", 40, y);
//     doc.font("Helvetica").text(numberToWords(invoice.totalAmount), 40, y + 15);

//     doc.fontSize(10).text("Thank you for your business!", 40, doc.page.height - 70, { align: "center" });
//     doc.end();

//     stream.on('finish', () => {
//       const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
//       res.status(200).json({ success: true, url: fileUrl });
//     });

//   } catch (error) {
//     res.status(500).json({ message: "PDF generation failed", error: error.message });
//   }
// };

exports.generateInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

    const filePath = path.join(uploadPath, fileName);
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header & Company Info
    doc.fontSize(20).font("Helvetica-Bold").text("BILLING PRO", 40, 40);
    doc.fontSize(10).font("Helvetica").text("Ahmedabad, Gujarat | Phone: 9876543210", 40, 65);
    doc.fontSize(16).text("TAX INVOICE", 40, 90, { align: "right" });
    doc.moveTo(40, 110).lineTo(550, 110).stroke();

    // Customer Info
    doc.fontSize(10).font("Helvetica-Bold").text("Bill To:", 40, 125);
    doc.font("Helvetica").text(`Customer: ${invoice.customerName}`, 40, 140);
    doc.text(`Email: ${invoice.customerEmail}`, 40, 155);

    doc.font("Helvetica-Bold").text("Invoice Details:", 350, 125);
    doc.font("Helvetica").text(`Invoice No: ${invoice.invoiceNumber}`, 350, 140);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 350, 155);

    // ==========================================
    // ✨ TABLE HEADER (HSN Column Added)
    // ==========================================
    let tableTop = 200;
    doc.fontSize(7.5).font("Helvetica-Bold");

    doc.text("No", 40, tableTop, { width: 18 });
    doc.text("Description", 60, tableTop, { width: 105 });
    doc.text("HSN", 167, tableTop, { width: 35 });
    doc.text("Qty", 204, tableTop, { width: 22, align: "right" });
    doc.text("Price", 228, tableTop, { width: 45, align: "right" });
    doc.text("Disc%", 275, tableTop, { width: 28, align: "right" });
    doc.text("Disc Amt", 305, tableTop, { width: 42, align: "right" });
    doc.text("GST%", 349, tableTop, { width: 28, align: "right" });
    doc.text("GST Amt", 379, tableTop, { width: 48, align: "right" });
    doc.text("Total", 429, tableTop, { width: 121, align: "right" });

    doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.font("Helvetica");

    let y = tableTop + 30;

    let effectiveGstPercent = invoice.gstPercent || 0;
    const totalGstAmount = (invoice.igst || 0) + (invoice.cgst || 0) + (invoice.sgst || 0);
    if (effectiveGstPercent === 0 && totalGstAmount > 0 && invoice.subTotal > 0) {
      effectiveGstPercent = (totalGstAmount / invoice.subTotal) * 100;
    }

    // ==========================================
    // TABLE ROWS
    // ==========================================
    invoice.items.forEach((item, index) => {
      let rate = item.gstRate || 0;
      let gstAmt = item.gstAmount || 0;
      let taxableVal = item.taxableValue || (item.price * item.quantity);
      
      // Legacy fallback
      if (rate === 0 && gstAmt === 0 && effectiveGstPercent > 0) {
        rate = effectiveGstPercent;
        gstAmt = (taxableVal * rate) / 100;
      } else if (rate === 0 && gstAmt > 0 && taxableVal > 0) {
        rate = Math.round((gstAmt / taxableVal) * 100);
      }

      const rowTotal = item.total > taxableVal ? item.total : (taxableVal + gstAmt);

      const rawTotal = (item.price || 0) * (item.quantity || 0);
      let dPerc = item.discountPercent || item.discountPercentage || 0;
      let dAmt = item.discountAmount || 0;
      if (dPerc === 0 && dAmt > 0 && rawTotal > 0) {
        dPerc = (dAmt / rawTotal) * 100;
      }
      if (dAmt === 0 && dPerc > 0 && rawTotal > 0) {
        dAmt = (rawTotal * dPerc) / 100;
      }
      const fmtDisc = dPerc > 0 ? `${dPerc.toFixed(1).replace(/\.0$/, '')}%` : "0%";
      const fmtDiscAmt = dAmt > 0 ? dAmt.toFixed(2) : "0.00";

      doc.fontSize(7.5).font("Helvetica");
      doc.text(index + 1, 40, y, { width: 18 });
      doc.text(item.productName || "N/A", 60, y, { width: 105 });
      doc.text(item.hsnCode || "N/A", 167, y, { width: 35 });
      doc.text(item.quantity.toString(), 204, y, { width: 22, align: "right" });
      doc.text((item.price || 0).toFixed(2), 228, y, { width: 45, align: "right" });
      doc.text(fmtDisc, 275, y, { width: 28, align: "right" });
      doc.text(fmtDiscAmt, 305, y, { width: 42, align: "right" });
      doc.text(`${rate}%`, 349, y, { width: 28, align: "right" });
      doc.text(gstAmt.toFixed(2), 379, y, { width: 48, align: "right" });
      doc.text((rowTotal || 0).toFixed(2), 429, y, { width: 121, align: "right" });

      y += 20;
    });

    doc.moveTo(40, y).lineTo(550, y).stroke();
    y += 15;

    // ==========================================
    // ✨ SUMMARY SECTION (IGST Logic Added)
    // ==========================================
    /*const summaryX = 350;
    const valueX = 465;
    doc.font("Helvetica-Bold").fontSize(10);

    doc.text("Taxable Value:", summaryX, y);
    doc.text((invoice.subTotal || 0).toFixed(2), valueX, y, { width: 85, align: "right" });
    
    y += 15;
    //item-wise discount(jo product me mile)
    doc.fillColor("#ef4444"); 
    doc.text("Item Discounts:", summaryX, y);
    doc.text(`- ${(invoice.totalDiscount || 0).toFixed(2)}`, valueX, y, { width: 85, align: "right" });
    
    y += 15;

    //Extra Bill Discount
    if(invoice.billDiscount > 0)
    {
      doc.fillColor("#ef4444");
      doc.text("Extra Bill Discount:",summaryX,y);
      doc.text(`- ${(invoice.billDiscount || 0).toFixed(2)}`,valueX,y, {width:85, align: "right"});
      y +=15;
    }
    doc.fillColor("#000").font("Helvetica").fontSize(9);
    
    // ✨ GST Split Logic
    if (invoice.igst > 0) {
      // Inter-state sale
      doc.text(`IGST (${effectiveGstPercent}%):`, summaryX, y);
      doc.text((invoice.igst || 0).toFixed(2), valueX, y, { width: 85, align: "right" });
    } else {
      // Intra-state sale (CGST + SGST)
      doc.text(`CGST (${effectiveGstPercent / 2}%):`, summaryX, y);
      doc.text((invoice.cgst || 0).toFixed(2), valueX, y, { width: 85, align: "right" });
      y += 15;
      doc.text(`SGST (${effectiveGstPercent / 2}%):`, summaryX, y);
      doc.text((invoice.sgst || 0).toFixed(2), valueX, y, { width: 85, align: "right" });
    }

    y += 20;
    doc.rect(summaryX - 5, y - 5, 205, 25).fill("#f1f5f9").stroke("#cbd5e1");
    doc.fillColor("#000").fontSize(11).font("Helvetica-Bold");
    doc.text("Grand Total:", summaryX, y);
    doc.text(`Rs. ${(invoice.totalAmount || 0).toFixed(2)}`, valueX, y, { width: 85, align: "right" });*/


    // ==========================================
    // ✨ SUMMARY SECTION (Updated for Clarity)
    // ==========================================
    const summaryX = 350;
    const valueX = 465;
    doc.font("Helvetica-Bold").fontSize(10);

    // A. Gross Value (Bina kisi discount ke)
    // Iske liye humein subTotal + totalDiscount + billDiscount karna hoga agar DB mein sirf net save hai
    const displayGross = invoice.grossTotal || ((invoice.subTotal || 0) + (invoice.totalDiscount || 0) + (invoice.billDiscount || 0));

    doc.text("Gross Total:", summaryX, y);
    doc.text(displayGross.toFixed(2), valueX, y, { width: 85, align: "right" });
    y += 15;

    // B. Discount Split Section
    doc.fillColor("#ef4444"); 
    
    // 1. Item-wise Discount
    doc.text("Item Discount (-):", summaryX, y);
    doc.text(`- ${(invoice.totalDiscount || 0).toFixed(2)}`, valueX, y, { width: 85, align: "right" });
    y += 15;

    // 2. Extra Bill Discount (Only if exists)
    // if (invoice.billDiscount > 0) {
    //   doc.text("Bill Discount (-):", summaryX, y);
    //   doc.text(`- ${(invoice.billDiscount || 0).toFixed(2)}`, valueX, y, { width: 85, align: "right" });
    //   y += 15;
    // }
    // 2. Extra Bill Discount (Dynamic Label)
    if (invoice.billDiscount > 0) {
      const discountLabel = invoice.billDiscountType === 'percent' 
        ? `Bill Discount (${invoice.billDiscountValue}%):` 
        : `Bill Discount (Fixed):`;

      doc.text(discountLabel, summaryX, y);
      doc.text(`- ${(invoice.billDiscount || 0).toFixed(2)}`, valueX, y, { width: 85, align: "right" });
      y += 15;
    }

    doc.fillColor("#000"); // Reset color

    // C. NET TAXABLE VALUE (Isi par GST calculate hota hai)
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(10);
    doc.text("Net Taxable Value:", summaryX, y);
    doc.text((invoice.subTotal || 0).toFixed(2), valueX, y, { width: 85, align: "right" });
    y += 20; // Thoda extra gap

    // D. GST Split Logic
    doc.font("Helvetica").fontSize(9);
    
    // Check if items have multiple rates
    const uniqueRates = [...new Set(invoice.items.map(i => i.gstRate || 0))];
    const isMixedRates = uniqueRates.length > 1;
    const fmtGstPercent = `${effectiveGstPercent.toFixed(2).replace(/\.00$/, '')}%`;

    if (invoice.igst > 0) {
      doc.text(`IGST (${fmtGstPercent}):`, summaryX, y);
      doc.text((invoice.igst || 0).toFixed(2), valueX, y, { width: 85, align: "right" });
    } else {
      const splitPercentLabel = `${(effectiveGstPercent / 2).toFixed(2).replace(/\.00$/, '')}%`;
      doc.text(`CGST (${splitPercentLabel}):`, summaryX, y);
      doc.text((invoice.cgst || 0).toFixed(2), valueX, y, { width: 85, align: "right" });
      y += 15;
      doc.text(`SGST (${splitPercentLabel}):`, summaryX, y);
      doc.text((invoice.sgst || 0).toFixed(2), valueX, y, { width: 85, align: "right" });
    }

    y += 20;
    // E. Grand Total Box
    doc.rect(summaryX - 5, y - 5, 205, 25).fill("#f1f5f9").stroke("#cbd5e1");
    doc.fillColor("#000").fontSize(11).font("Helvetica-Bold");
    doc.text("Grand Total:", summaryX, y);
    doc.text(`Rs. ${(invoice.totalAmount || 0).toFixed(2)}`, valueX, y, { width: 85, align: "right" });

    // Amount in Words
    y += 40;
    doc.fontSize(10).font("Helvetica-Bold").text("Amount in Words:", 40, y);
    doc.font("Helvetica").text(numberToWords(invoice.totalAmount), 40, y + 15);

    doc.end();
    stream.on('finish', () => {
      res.status(200).json({ 
        success: true, 
        url: `${req.protocol}://${req.get('host')}/uploads/${fileName}`,
        fileName: fileName // ✅ Now frontend can see the filename
      });
    });

  } catch (error) {
    res.status(500).json({ message: "PDF generation failed", error: error.message });
  }
};