


//pagination sorting and searching 
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    hsnCode: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    stock: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      required: true
    },
    gstRate: {
      type: Number,
      required: true,
      default: 18,
      enum: [0,5,12,18,28] //valid gst slabs
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    discountType: {
      type: String,
      enum: ["percentage","flat"],
      default: "percentage"
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    
    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true
    // }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);


