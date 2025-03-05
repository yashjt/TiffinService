const express = require("express");
const homeController = require("../controllers/homeController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/home", authMiddleware, homeController.homePage);

module.exports = router;
