const Order = require("../models/Order");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.getOrderPage = async (req, res) => {
  // With Auth0, check if authenticated
  if (!req.oidc || !req.oidc.isAuthenticated()) {
    return res.redirect("/login");
  }

  try {
    // Connect to MongoDB and fetch menu items from the Next.js database
    const MenuModel = mongoose.connection.model(
      "Menu",
      new mongoose.Schema({
        name: String,
        price: Number,
      }),
      "menus"
    ); // 'menus' is the collection name your Next.js app uses

    // Query menu items from the database
    const menuItems = await MenuModel.find({});

    // If no menu items found in database, use the default menu
    const menu =
      menuItems.length > 0
        ? menuItems
        : [
            { id: 1, name: "Vegetarian Thali", price: 12 },
            { id: 2, name: "Non-Vegetarian Thali", price: 15 },
            { id: 3, name: "Paneer Masala", price: 12 },
            { id: 4, name: "Chicken Curry", price: 18 },
          ];

    // Format menu items to match the expected format
    const formattedMenu = menu.map((item) => ({
      id: item._id || item.id,
      name: item.name,
      price: item.price,
    }));

    // Use either database user or Auth0 user
    const user = req.user || req.oidc.user;

    res.render("order", {
      user: user,
      menu: formattedMenu,
      title: "Order Food",
      active: "order",
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    // Fallback to default menu if there's an error
    const menu = [
      { id: 1, name: "Vegetarian Thali", price: 12 },
      { id: 2, name: "Non-Vegetarian Thali", price: 15 },
      { id: 3, name: "Paneer Masala", price: 12 },
      { id: 4, name: "Chicken Curry", price: 18 },
    ];

    const user = req.user || req.oidc.user;

    res.render("order", {
      user: user,
      menu: menu,
      title: "Order Food",
      active: "order",
    });
  }
};

exports.createOrder = async (req, res) => {
  try {
    // Check authentication
    if (!req.oidc || !req.oidc.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { items, deliveryAddress } = req.body;
    if (!items || !deliveryAddress) {
      return res.status(400).json({ error: "Invalid order details" });
    }

    // Get user ID - either from database user or create/get from Auth0 user
    let userId;

    if (req.user) {
      // If we already have a database user
      userId = req.user._id;
    } else {
      // Find or create user based on Auth0 profile
      const auth0User = req.oidc.user;
      let dbUser = await User.findOne({ email: auth0User.email });

      if (!dbUser) {
        // Create new user if not found
        dbUser = await User.create({
          username:
            auth0User.nickname ||
            auth0User.name ||
            auth0User.email.split("@")[0],
          email: auth0User.email,
          password: Math.random().toString(36).slice(-10), // Random password
          auth0Id: auth0User.sub,
        });
      }

      userId = dbUser._id;
    }

    // calculate total price
    const totalPrice = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // create order
    const order = new Order({
      user: userId,
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
    // Check authentication
    if (!req.oidc || !req.oidc.isAuthenticated()) {
      return res.redirect("/login");
    }

    let userId;

    // Get user ID from database user or Auth0 user
    if (req.user) {
      userId = req.user._id;
    } else {
      // Find user based on Auth0 email
      const auth0User = req.oidc.user;
      const dbUser = await User.findOne({ email: auth0User.email });

      if (!dbUser) {
        // No orders yet if user doesn't exist in our database
        return res.render("order-history", {
          orders: [],
          user: auth0User,
          title: "Order History",
          active: "orders",
        });
      }

      userId = dbUser._id;
    }

    // Try to query orders from both collections
    let orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean(); // Using lean() for better performance

    // Use either database user or Auth0 user for rendering
    const user = req.user || req.oidc.user;

    res.render("order-history", {
      orders,
      user: user,
      title: "Order History",
      active: "orders",
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).render("error", {
      title: "Server Error",
      error: "Failed to fetch orders",
      user: req.oidc ? req.oidc.user : null,
      active: "",
    });
  }
};

// Function for cancelling orders
exports.cancelOrder = async (req, res) => {
  try {
    // Check authentication
    if (!req.oidc || !req.oidc.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const orderId = req.params.id;

    // Get user ID from database user or Auth0 user
    let userId;

    if (req.user) {
      userId = req.user._id;
    } else {
      // Find user based on Auth0 email
      const auth0User = req.oidc.user;
      const dbUser = await User.findOne({ email: auth0User.email });

      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      userId = dbUser._id;
    }

    // Find the order and check if it belongs to the current user
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
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
