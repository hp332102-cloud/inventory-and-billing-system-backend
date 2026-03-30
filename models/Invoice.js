const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
    },
    //add user schema karyu pachhi
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    //invoice item
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        //Snapshot of product name at billing time
        productName: {
          type: String,
          required: true,
        },
        hsnCode: {
          type: String, // Kept optional for backward compatibility
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        discountPercent: {
          type: Number,
          default: 0
        },
        discountAmount: {
          type: Number,
          default: 0
        },
        taxableValue: {
          type: Number,
          required: true // (Price*Qty) - Discount
        },
        gstRate: {
          type: Number,
          default: 0
        },
        gstAmount: {
          type: Number,
          default: 0
        },
        //Snapshot of stock available when invoice created
        stockAtBilling: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
          required: true,
        },
      },
    ],
    totalDiscount: {
      type: Number,
      default: 0
    },
    billDiscount: {
      type: Number,
      default: 0
    },
    billDiscountType: {
      type: String,
      enum: ["percentage","flat"],
      default: "percentage"
    },
    billDiscountValue: {
      //salesman ne jo actual value enter ki(like 5% ya 500 RS)
      type: Number,
      default: 0
    },
    grossTotal: {
      //NEW: MRP Total (bina discount vala)
      type: Number,
      default: 0
    },
    subTotal: {
      type: Number,
      required: true,
    },
    gstPercent: {
      type: Number,
      required: true,
    },
    cgst: {
      type: Number,
      required: true,
    },
    sgst: {
      type: Number,
      required: true,
    },
    igst: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Cancelled"],
      default: "Active",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
    isInterState: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
