/*const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
app.unsubscribe("/api/products",productRoutes);

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Inventory Billing API Running");
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});*/


/*const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();   // ✅ app YAHAN banta hai

// Middleware
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Routes
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);   // ✅ yahan use hota hai

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});*/


/*const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// 🔥 VERY IMPORTANT (YE LINE MISS HUI TO SAB FAIL)
app.use(express.json());

const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.send("Server running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});*/

require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

const path = require("path");

const dashboardRoutes = require("./routes/dashboardRoutes");


const app = express();

app.use(cors());
//const userRoutes = require("./routes/userRoutes");
//app.use("/api/users",userRoutes);
app.use(express.json());
app.use("/api/users",require("./routes/userRoutes"));

// Body parser
app.use(express.json()); // Ye zaruri hai, warna req.body undefined ayega

// Routes
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));//customerRoute add kiya
app.use("/api/invoices", require("./routes/invoiceRoutes"));//invoiceRoute add 

// Static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//app.use("/uploads", express.static("uploads"));//pdf generator mate

app.use("/api/dashboard", dashboardRoutes);



// DB Connect
const PORT = process.env.PORT || 5000;//render mate
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(err));

//Note: Maine 0.0.0.0 isliye add kiya hai taaki Render ka network aapke server ko bahar se access kar sake.