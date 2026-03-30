const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");


// register
//router.post("/register", auth, role("admin"), userController.registerUser);
router.post("/register", userController.registerUser);


// login
router.post("/login", userController.loginUser);

// get users
router.get("/", auth, role("admin"), userController.getUsers);


module.exports = router;
