const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/checkout/:id", authMiddleware, paymentController.getCheckoutPage);
router.post(
  "/create-payment-intent",
  authMiddleware,
  paymentController.createPaymentIntent
);
router.post(
  "/payment-success",
  authMiddleware,
  paymentController.handlePaymentSuccess
);

module.exports = router;
