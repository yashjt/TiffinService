require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");

connectDB();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

app.use("/auth", authRoutes);

app.get("/home", protect, (req, res) => {
  res.render("home", { user: req.user });
});

app.get("/", (req, res) => {
  res.redirect("/auth/login");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
