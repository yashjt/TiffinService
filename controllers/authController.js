const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

exports.registerPage = (req, res) => {
  // If user is already logged in, redirect to home
  if (req.user) {
    return res.redirect("/home");
  }
  res.render("register", {
    error: null,
    title: "Register",
    active: "register",
  });
};

exports.loginPage = (req, res) => {
  // If user is already logged in, redirect to home
  if (req.user) {
    return res.redirect("/home");
  }
  res.render("login", {
    error: null,
    title: "Login",
    active: "login",
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.render("register", {
        error: "User with this email or username already exists",
        title: "Register",
        active: "register",
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password,
    });

    // Generate token
    const token = generateToken(newUser._id);

    // Set cookie
    res.cookie("jwt", token, {
      expires: new Date(
        Date.now() + process.env.JWT_EXPIRES.slice(0, -1) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.redirect("/home");
  } catch (error) {
    res.render("register", {
      error: error.message || "Registration failed",
      title: "Register",
      active: "register",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.render("login", {
        error: "Please provide email and password",
        title: "Login",
        active: "login",
      });
    }

    // Find user and select password
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists and password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.render("login", {
        error: "Incorrect email or password",
        title: "Login",
        active: "login",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie("jwt", token, {
      expires: new Date(
        Date.now() + process.env.JWT_EXPIRES.slice(0, -1) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.redirect("/home");
  } catch (error) {
    res.render("login", {
      error: error.message || "Login failed",
      title: "Login",
      active: "login",
    });
  }
};

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.redirect("/login");
};
