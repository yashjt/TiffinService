require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");

// Route imports
const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const orderRoutes = require("./routes/orderRoutes");

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
// global middleware

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next(); // This is essential to continue to the next middleware
});

// Routes

app.use(authRoutes);
app.use(homeRoutes);
app.use(orderRoutes);
// Default route
app.get("/", (req, res) => {
  res.redirect("/login");
});
app.use((req, res) => {
  res.status(404).render("404", {
    title: "404 - Page Not Found",
    active: null, // or any default value
    user: req.session.user || null,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    title: "Server Error",
    error: err,
    user: req.user || null,
    active: "", // Provide a default value to avoid undefined error
  });
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
