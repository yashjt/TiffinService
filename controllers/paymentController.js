const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const Payment = require("../models/Payment");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Stripe requires amount in cents
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({ error: "Failed to initialize payment" });
  }
};

exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Verify the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    // Create payment record
    const payment = new Payment({
      order: orderId,
      paymentId: paymentIntentId,
      amount: paymentIntent.amount / 100, // Convert back from cents
      status: "completed",
      paymentMethod: paymentIntent.payment_method_types[0],
    });

    await payment.save();

    // Update order status if needed
    const order = await Order.findById(orderId);
    if (order) {
      order.status = "Confirmed";
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      orderId: orderId,
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
};

exports.getCheckoutPage = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).render("error", {
        title: "Order Not Found",
        error: "The requested order does not exist",
        user: req.user,
        active: "",
      });
    }

    res.render("checkout", {
      order: order,
      user: req.user,
      title: "Checkout",
      active: "orders",
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("Checkout page error:", error);
    res.status(500).render("error", {
      title: "Server Error",
      error: "Failed to load checkout page",
      user: req.user,
      active: "",
    });
  }
};
