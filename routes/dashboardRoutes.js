const express = require("express");
const router = express.Router();

const { getDashboardData } = require("../controllers/dashboardController");

router.get("/", getDashboardData);

module.exports = router;


/*const express = require("express");
const router = express.Router();

const {
  getDashboardSummary
} = require("../controllers/dashboardController");

router.get("/", getDashboardSummary);

module.exports = router;*/