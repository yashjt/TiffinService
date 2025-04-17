const express = require("express");
const homeController = require("../controllers/homeController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Apply a modified middleware to the root route that doesn't redirect
router.get("/", homeController.getHomePage);

// Keep the protected home route
router.get("/home", authMiddleware, homeController.getHomePage);

// Add other routes
router.get("/about", homeController.getAboutPage);
router.get("/contact", homeController.getContactPage);

module.exports = router;
