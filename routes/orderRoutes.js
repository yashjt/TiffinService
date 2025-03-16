const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/order", authMiddleware, orderController.getOrderPage);
router.post("/create-order", authMiddleware, orderController.createOrder);
router.get("/my-orders", authMiddleware, orderController.getUserOrders);
// Add the new route for cancelling orders
router.post("/cancel-order/:id", authMiddleware, orderController.cancelOrder);
module.exports = router;
