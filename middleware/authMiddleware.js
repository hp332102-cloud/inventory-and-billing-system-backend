//jwt(jsonwebtoken) library ko use karne k liye,,jwt ka use token verify karva mate use thay
const jwt = require("jsonwebtoken");
//middleware function create means request ko check karta he
module.exports = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token"
    });
  }
  //bearer remove
  const token = authHeader.split(" ")[1];
  // console.log(token);

  try {
    // console.log(token, process.env.JWT_SECRET, authHeader)
    //const decoded = jwt.verify(token, "secretkey");//token ne verify karine ne ena underna datane kadhe chhe
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;//ye user data ko req.user me save karta he

    next();//run hone k liye allow kare ye function(user login chhe k nathi te check kare)

  } catch (error) {
    // console.log(error);
    //res.status(401).json({
    return res.status(401).json({
      message: "Invalid token"
    });

  }
};
