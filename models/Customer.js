/*const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: String,
  mobileNumber: String,
  email: String,
  address: String,
  gstNumber: String
}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);*/


const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        lowercase: true
    },
    state: {
        type: String,
        required: true,
        default: "Gujarat"
    },
    address: {
        type: String,
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        uppercase: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);

