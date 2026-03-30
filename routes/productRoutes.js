/*const express = require("express");
const router = express.Router();

const {
  addProduct,
  getAllProducts
} = require("../controllers/productController");

router.post("/", addProduct);//add product
router.get("/", getAllProducts);//view all product

module.exports = router;*/


/*const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

router.post("/", addProduct);   // ✅ function
router.get("/", getProducts);   // ✅ function

router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);


module.exports = router;*/


/*const express = require("express");
const { getProducts } = require("../controllers/productController");
const router = express.Router();

// GET Products
router.get("/", getProducts);

// POST Product add karne ke liye
router.post("/", async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;
    const product = await require("../models/Product").create({
      name,
      price,
      stock,
      category
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;*/



const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");


// CRUD + Pagination, Search, Sort
//create product--->admin only
router.post("/",auth,role("admin"), productController.addProduct);
//Get all products-->admin + cashier
router.get("/",auth, productController.getProducts);
//Update product -->admin only
router.put("/:id",auth,role("admin"), productController.updateProduct);
//Delete product --> admin only
router.delete("/:id",auth,role("admin"), productController.deleteProduct);

module.exports = router;

