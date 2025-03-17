const Order = require("../models/Order");

exports.getOrderPage = (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const menu = [
    { id: 1, name: "Vegetarian Thali", price: 10 },
    { id: 2, name: "Non-Vegetarian Thali", price: 15 },
    { id: 3, name: "Paneer Masala", price: 12 },
    { id: 4, name: "Chicken Curry", price: 18 },
  ];

  res.render("order", {
    user: req.user,
    menu: menu,
    title: "Order Food",
    active: "order",
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;
    if (!items || !deliveryAddress) {
      return res.status(400).json({ error: "Invalid order details" });
    }

    // calculate total price
    const totalPrice = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
    // create order
    const order = new Order({
      user: req.user.id,
      items: items,
      totalPrice: totalPrice,
      deliveryAddress: deliveryAddress,
      status: "Pending", // Change default status to Pending until payment
    });
    await order.save();
    res.status(201).json({
      message: "Order placed successfully",
      orderId: order._id,
      redirect: `/checkout/${order._id}`, // Add redirect URL to checkout
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean(); // Using lean() for better performance

    res.render("order-history", {
      orders,
      user: req.user,
      title: "Order History",
      active: "orders",
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).render("error", {
      title: "Server Error",
      error: "Failed to fetch orders",
      user: req.user,
      active: "",
    });
  }
};

// Add this new function for cancelling orders
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find the order and check if it belongs to the current user
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if the order can be cancelled (only if it's not already delivered or cancelled)
    if (order.status === "Delivered") {
      return res.status(400).json({
        error: "Cannot cancel an order that has already been delivered",
      });
    }

    if (order.status === "Cancelled") {
      return res
        .status(400)
        .json({ error: "This order has already been cancelled" });
    }

    // Update the order status to cancelled
    order.status = "Cancelled";
    await order.save();

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
};
