// const mongoose = require("mongoose");

// const settingsSchema = new mongoose.Schema(
//   {
//     storeName: {
//       type: String,
//       required: true,
//       trim: true
//     },

//     gstNumber: {
//       type: String,
//       required: true,
//       uppercase: true
//     },

//     address: {
//       type: String,
//       required: true
//     },

//     phone: {
//       type: String
//     },

//     email: {
//       type: String
//     },

//     cgstPercent: {
//       type: Number,
//       required: true,
//       default: 9
//     },

//     sgstPercent: {
//       type: Number,
//       required: true,
//       default: 9
//     },

//     state: {
//       type: String,
//       required: true
//     }
//   },
//   {
//     timestamps: true
//   }
// );

// module.exports = mongoose.model("Settings", settingsSchema);