require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { auth } = require("express-openid-connect");
const connectDB = require("./config/database");

// Route imports
const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Import middleware
const { setUserLocals } = require("./middleware/authMiddleware");

const app = express();

// Connect to Database
connectDB();

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth0 configuration
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  routes: {
    login: '/login',
    logout: '/logout',
    callback: '/callback'
  }
};

// Auth router
app.use(auth(config));

// Set user locals for templates
app.use(setUserLocals);

// Routes
app.use(authRoutes);
app.use(homeRoutes);
app.use(orderRoutes);
app.use(paymentRoutes);

// Default route
app.get("/", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    return res.redirect("/home");
  }
  res.redirect("/login");
});

// 404 route
app.use((req, res) => {
  res.status(404).render("404", {
    title: "404 - Page Not Found",
    active: null,
    user: req.oidc.user || null,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    title: "Server Error",
    error: err,
    user: req.oidc.user || null,
    active: "", // Provide a default value to avoid undefined error
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
