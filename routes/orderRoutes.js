const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/order",authMiddleware, orderController.getOrderPage);
router.post("/create-order", authMiddleware, orderController.createOrder);
module.exports = router