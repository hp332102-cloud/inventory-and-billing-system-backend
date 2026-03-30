const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ======================
// REGISTER USER (Admin create)
// ======================

//ye function new user create karega
exports.registerUser = async (req, res) => {
  try {

    //ye postman me data leta he
    const { name, email, mobile, password, role } = req.body;

    // check existing(check user already exist he ya nahi)
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //new user create karna(means dtabase mate object banave)
    const user = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      role
    });

    await user.save();//database(mongodb) me save karna

    res.json({
      message: "User created successfully",
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ======================
// LOGIN USER
// ======================

//login user function 
exports.loginUser = async (req, res) => {
  try {

    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    // create token(ye login token karta he and token me data hota he)
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    //response send karna
    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ======================
// GET ALL USERS (Admin only)
// ======================

//ye function sab users fetch karta he
exports.getUsers = async (req, res) => {

  const users = await User.find().select("-password");//ye mongodb se sab users leta he and password show nahi karega

  res.json(users);
};
