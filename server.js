
// require("dotenv").config();
// const cors = require("cors");
// const express = require("express");
// const mongoose = require("mongoose");

// const path = require("path");

// const dashboardRoutes = require("./routes/dashboardRoutes");


// const app = express();

// app.use(cors({
//   origin: "*" //sabhi jagah se access allow karne k liye
// }));
// //const userRoutes = require("./routes/userRoutes");
// //app.use("/api/users",userRoutes);
// app.use(express.json());
// app.use("/api/users",require("./routes/userRoutes"));

// // Body parser
// app.use(express.json()); // Ye zaruri hai, warna req.body undefined ayega

// // Routes
// app.use("/api/products", require("./routes/productRoutes"));
// app.use("/api/customers", require("./routes/customerRoutes"));//customerRoute add kiya
// app.use("/api/invoices", require("./routes/invoiceRoutes"));//invoiceRoute add 

// // Static folder
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// //app.use("/uploads", express.static("uploads"));//pdf generator mate

// app.use("/api/dashboard", dashboardRoutes);



// // DB Connect
// const PORT = process.env.PORT || 5000;//render mate
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("MongoDB Connected");
//     app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
//   })
//   .catch((err) => console.log(err));

// //Note: Maine 0.0.0.0 isliye add kiya hai taaki Render ka network aapke server ko bahar se access kar sake.



require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs"); // Added for folder check

const app = express();

// 1. Middlewares
//app.use(cors({ origin: "*" }));

// 1. Middlewares
app.use(cors({ 
  origin: ["http://localhost:5173", "http://localhost:5174", "https://vercel.com/hp332102-clouds-projects/inventory-and-billing-system-frontend"], // Local aur Vercel dono allow karein
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true 
}));
app.use(express.json()); // Ek hi baar kaafi hai

// 2. Ensure Folders Exist (Very important for PDF generation)
const reportsDir = path.join(__dirname, "uploads", "reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// 3. Static Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 4. Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// 5. DB Connect & Server Start
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("❌ DB Error:", err));