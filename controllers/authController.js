const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models /User");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });
    res.redirect("/home");
  } catch (error) {
    res.status(400).render("register", { error: error.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid email or password");
    }
    const token = signToken(user._id);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });
    res.redirect("/home");
  } catch (error) {
    res.status(400).render("login", { error: error.message });
  }
};

exports.logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/auth/login");
};
