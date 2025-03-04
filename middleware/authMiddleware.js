const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect("/auth/login");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.redirect("/auth/login");
  }
};

module.exports = { protect };
