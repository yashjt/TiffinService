const express = require("express");
const orderController = require("../controllers/orderController");
// Use destructuring to get the authMiddleware function
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/order", authMiddleware, orderController.getOrderPage);
router.post("/create-order", authMiddleware, orderController.createOrder);
router.get("/my-orders", authMiddleware, orderController.getUserOrders);
router.post("/cancel-order/:id", authMiddleware, orderController.cancelOrder);

module.exports = router;
