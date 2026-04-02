const Customer = require("../models/Customer");

// Add Customer
exports.addCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address, gstNumber, state } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ msg: "Name and Mobile are required" });
    }

    // Normalizing inputs
    const cleanMobile = mobile.trim();
    const cleanEmail = email && email.trim() !== "" ? email.trim().toLowerCase() : undefined;
    const cleanGst = gstNumber && gstNumber.trim() !== "" ? gstNumber.trim().toUpperCase() : undefined;

    // Check for existing mobile
    const existingMobile = await Customer.findOne({ mobile: cleanMobile });
    if (existingMobile) {
      return res.status(400).json({ msg: "Customer with this mobile number already exists" });
    }

    // Check for existing email (case-insensitive done via lowercase normalization)
    if (cleanEmail) {
      const existingEmail = await Customer.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(400).json({ msg: "Customer with this email ID already exists" });
      }
    }

    // Check for existing GST Number
    if (cleanGst) {
      const existingGst = await Customer.findOne({ gstNumber: cleanGst });
      if (existingGst) {
        return res.status(400).json({ msg: "Customer with this GST Number already exists" });
      }
    }

    const customerData = { 
      name, 
      mobile: cleanMobile, 
      address, 
      state: state || "Gujarat" 
    };

    if (cleanEmail) customerData.email = cleanEmail;
    if (cleanGst) customerData.gstNumber = cleanGst;

    const customer = new Customer(customerData);
    
    await customer.save();
    res.status(201).json({ msg: "Customer added successfully", customer });
  } catch (error) {
    if (error.code === 11000) {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : "field";
      return res.status(400).json({ msg: `Customer with this ${field} already exists` });
    }
    res.status(500).json({ msg: error.message });
  }
};

// Get All Customers with Pagination, Sorting & Search
exports.getAllCustomers = async (req, res) => {
  try {
    let { page = 1, limit = 5, sortBy = "createdAt", order = "desc", search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    order = order === "asc" ? 1 : -1;

    const query = search ? {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { gstNumber: { $regex: search, $options: "i" }}
      ],
    } : {};

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      customers,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Get Customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ msg: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Update Customer
exports.updateCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { name, mobile, email, address, gstNumber, state } = req.body;

    // Normalizing inputs
    const cleanMobile = mobile ? mobile.trim() : undefined;
    const cleanEmail = email && email.trim() !== "" ? email.trim().toLowerCase() : (email === "" ? null : undefined);
    const cleanGst = gstNumber && gstNumber.trim() !== "" ? gstNumber.trim().toUpperCase() : (gstNumber === "" ? null : undefined);

    if (cleanMobile) {
      const existingMobile = await Customer.findOne({ mobile: cleanMobile, _id: { $ne: customerId } });
      if (existingMobile) {
        return res.status(400).json({ msg: "Mobile number is already registered to another customer" });
      }
    }

    if (cleanEmail) {
      const existingEmail = await Customer.findOne({ email: cleanEmail, _id: { $ne: customerId } });
      if (existingEmail) {
        return res.status(400).json({ msg: "Email ID is already registered to another customer" });
      }
    }

    if (cleanGst) {
      const existingGst = await Customer.findOne({ gstNumber: cleanGst, _id: { $ne: customerId } });
      if (existingGst) {
        return res.status(400).json({ msg: "GST Number is already registered to another customer" });
      }
    }

    const updateData = { ...req.body };
    const unsetData = {};

    if (cleanMobile !== undefined) updateData.mobile = cleanMobile;
    
    // Email: If provided and not empty, set it. If empty string OR null, unset it. Otherwise don't touch.
    if (email && email.trim() !== "") {
      updateData.email = email.trim().toLowerCase();
    } else if (email === "" || email === null) {
      delete updateData.email;
      unsetData.email = 1;
    } else {
      delete updateData.email;
    }

    // GST Number: If provided and not empty, set it. If empty string OR null, unset it. Otherwise don't touch.
    if (gstNumber && gstNumber.trim() !== "") {
      updateData.gstNumber = gstNumber.trim().toUpperCase();
    } else if (gstNumber === "" || gstNumber === null) {
      delete updateData.gstNumber;
      unsetData.gstNumber = 1;
    } else {
      delete updateData.gstNumber;
    }

    const finalUpdate = { $set: updateData };
    if (Object.keys(unsetData).length > 0) {
      finalUpdate.$unset = unsetData;
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(customerId, finalUpdate, { new: true, runValidators: true });
    if (!updatedCustomer) return res.status(404).json({ msg: "Customer not found" });
    
    res.json({ msg: "Customer updated successfully", updatedCustomer });
  } catch (error) {
    if (error.code === 11000) {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : "field";
      return res.status(400).json({ msg: `Customer with this ${field} already exists` });
    }
    res.status(500).json({ msg: error.message });
  }
};

// Delete Customer
exports.deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) return res.status(404).json({ msg: "Customer not found" });
    res.json({ msg: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Search by Mobile
exports.searchCustomerByMobile = async (req, res) => {
  try {
    const { mobile } = req.params;
    const customer = await Customer.findOne({ mobile: mobile.trim() });
    if (!customer) return res.status(404).json({ msg: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
