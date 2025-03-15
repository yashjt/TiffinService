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
    });
    await order.save();
    res.status(201).json({
      message: "Order placed successfully",
      orderId: order._id,
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
