
//advance version

const Product = require("../models/Product");

// =======================
// GET PRODUCTS (Paginate + Search + Sort)
// =======================
exports.getProducts = async (req, res) => {
  try {
    // Query params
    const page = Math.max(1, Number(req.query.page)) || 1; // minimum 1
    const limit = Math.max(1, Number(req.query.limit)) || 5; // minimum 1

    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;

    // Pagination logic
    const skip = (page - 1) * limit;

    // Search across multiple fields (name, category, description)
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { hsnCode: { $regex: search, $options: "i"}},
            { category: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    // Fetch products with sorting and pagination
    const products = await Product.find(searchQuery)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalProducts / limit);

    // Next & Previous page info
    const pagination = {
      currentPage: page,
      totalPages,
      limit,
      totalProducts,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    };

    res.status(200).json({
      success: true,
      pagination,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// ADD PRODUCT
// =======================
exports.addProduct = async (req, res) => {
  try {
    const { name, category, price, stock, description, gstRate, discountPercentage, discountType, hsnCode, lowStockThreshold } = req.body;

    if (!name || !category || !price || !hsnCode) {
      return res.status(400).json({
        success: false,
        message: "Name, HSN Code, category, and price are required"
      });
    }

    const newProduct = new Product({
      name,
      hsnCode,
      category,
      price,
      stock: stock || 0,
      description: description || "",
      gstRate: gstRate || 18,
      discountPercentage: discountPercentage || 0,
      discountType: discountType || "percentage",
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 10
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: savedProduct
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// UPDATE PRODUCT
// =======================
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }

};

// =======================
// DELETE PRODUCT
// =======================
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      product: deletedProduct
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

