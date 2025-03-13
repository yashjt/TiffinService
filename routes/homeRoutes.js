const express = require("express");
const homeController = require("../controllers/homeController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/", homeController.getHomePage);
router.get("/home", authMiddleware, homeController.getHomePage);
router.get("/about", homeController.getAboutPage);
router.get("/contact", homeController.getContactPage);
module.exports = router;
