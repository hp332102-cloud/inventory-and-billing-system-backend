const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

router.post("/add", customerController.addCustomer);
router.get("/", customerController.getAllCustomers);
router.get("/:id", customerController.getCustomerById);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);
router.get("/search/:mobile", customerController.searchCustomerByMobile);

module.exports = router;
