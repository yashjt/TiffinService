const express = require("express");
const paymentController = require("../controllers/paymentController");
const { authMiddleware } = require("../middleware/authMiddleware");

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

// Add these new routes
router.post(
  "/place-cod-order",
  authMiddleware,
  paymentController.placeCodOrder
);
router.post(
  "/fallback-payment-success",
  authMiddleware,
  paymentController.fallbackPaymentSuccess
);

module.exports = router;
