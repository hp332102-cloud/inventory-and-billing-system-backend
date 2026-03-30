//without paging , searching and sorting

/*const Customer = require("../models/Customer");

// Add Customer
exports.addCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address, gstNumber } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ msg: "Name and Mobile are required" });
    }

    const existingCustomer = await Customer.findOne({ mobile });
    if (existingCustomer) {
      return res.status(400).json({ msg: "Customer with this mobile already exists" });
    }

    const customer = new Customer({ name, mobile, email, address, gstNumber });
    await customer.save();

    res.status(201).json({ msg: "Customer added successfully", customer });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Get All Customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
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
    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCustomer) return res.status(404).json({ msg: "Customer not found" });
    res.json({ msg: "Customer updated successfully", updatedCustomer });
  } catch (error) {
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
    const customer = await Customer.findOne({ mobile });
    if (!customer) return res.status(404).json({ msg: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};*/


//with pagination,sorting and searching


/*const Customer = require("../models/Customer");

// Add Customer
exports.addCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address, gstNumber,state } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ msg: "Name and Mobile are required" });
    }

    const existingCustomer = await Customer.findOne({ mobile });
    if (existingCustomer) {
      return res.status(400).json({ msg: "Customer with this mobile already exists" });
    }

    const customer = new Customer({ name, mobile, email, address, gstNumber });
    await customer.save();

    res.status(201).json({ msg: "Customer added successfully", customer });
  } catch (error) {
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

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

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
    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCustomer) return res.status(404).json({ msg: "Customer not found" });
    res.json({ msg: "Customer updated successfully", updatedCustomer });
  } catch (error) {
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
    const customer = await Customer.findOne({ mobile });
    if (!customer) return res.status(404).json({ msg: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};*/


const Customer = require("../models/Customer");

// Add Customer
exports.addCustomer = async (req, res) => {
  try {
    // ✨ FIX: Yahan 'state' add kiya gaya hai
    const { name, mobile, email, address, gstNumber, state } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ msg: "Name and Mobile are required" });
    }

    const existingCustomer = await Customer.findOne({ mobile });
    if (existingCustomer) {
      return res.status(400).json({ msg: "Customer with this mobile already exists" });
    }

    // ✨ FIX: Yahan database mein 'state' save ho rahi hai
    const customer = new Customer({ 
      name, 
      mobile, 
      email, 
      address, 
      gstNumber,
      state: state || "Gujarat" // Default "Gujarat" agar kuch na mile
    });
    
    await customer.save();

    res.status(201).json({ msg: "Customer added successfully", customer });
  } catch (error) {
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

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { gstNumber: { $regex: search, $options: "i" }}
      ],
    };

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
    // Isme pehle se hi req.body ja raha tha, isliye edit kaam kar raha tha
    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCustomer) return res.status(404).json({ msg: "Customer not found" });
    res.json({ msg: "Customer updated successfully", updatedCustomer });
  } catch (error) {
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
    const customer = await Customer.findOne({ mobile });
    if (!customer) return res.status(404).json({ msg: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
