const Order = require("../models/Order");
const User = require("../models/User");
const TaxConfig = require("../models/TaxConfig"); // Import the model directly
const mongoose = require("mongoose");

// Function to get tax configuration from database

async function getTaxConfig() {
  try {
    // Use the TaxConfig model directly
    const config = await TaxConfig.findOne();

    // Return default values if no config found
    if (!config) {
      return {
        baseRate: 0.111,
        alcoholRate: 0.125,
        dessertRateMultiplier: 0.5,
      };
    }

    return config;
  } catch (error) {
    console.error("Error fetching tax configuration:", error);
    // Return default values if error
    return {
      baseRate: 0.111,
      alcoholRate: 0.125,
      dessertRateMultiplier: 0.5,
    };
  }
}

// Function to calculate tax for a menu item
async function calculateItemTax(item) {
  const taxConfig = await getTaxConfig();

  // Skip tax calculation for tax-exempt items
  if (item.taxExempt) {
    return 0;
  }

  const price = Number(item.price);
  let taxRate = taxConfig.baseRate;

  // Apply special tax rate for alcoholic beverages
  const isAlcoholic =
    item.isAlcoholic ||
    (item.category === "beverage" &&
      (item.name.toLowerCase().includes("wine") ||
        item.name.toLowerCase().includes("beer") ||
        item.name.toLowerCase().includes("cocktail") ||
        item.name.toLowerCase().includes("alcohol")));

  if (isAlcoholic) {
    taxRate = taxConfig.alcoholRate;
  }

  // Apply special treatment for desserts
  if (item.category === "dessert") {
    taxRate = taxRate * taxConfig.dessertRateMultiplier;
  }

  return Number((price * taxRate).toFixed(2));
}

exports.getOrderPage = async (req, res) => {
  // With Auth0, check if authenticated
  if (!req.oidc || !req.oidc.isAuthenticated()) {
    return res.redirect("/login");
  }

  try {
    // Get current tax configuration for rendering
    const taxConfig = await getTaxConfig();

    // Connect to MongoDB and fetch menu items from the Next.js database
    const MenuModel = mongoose.connection.model(
      "Menu",
      new mongoose.Schema({
        name: String,
        price: Number,
        category: String,
        isAvailable: Boolean,
        taxExempt: Boolean,
      }),
      "menus"
    ); // 'menus' is the collection name your Next.js app uses

    // Query menu items from the database (only available items)
    const menuItems = await MenuModel.find({ isAvailable: { $ne: false } });

    // If no menu items found in database, use the default menu
    const menu =
      menuItems.length > 0
        ? menuItems
        : [
            { id: 1, name: "Vegetarian Thali", price: 12, category: "main" },
            {
              id: 2,
              name: "Non-Vegetarian Thali",
              price: 15,
              category: "main",
            },
            { id: 3, name: "Paneer Masala", price: 12, category: "main" },
            { id: 4, name: "Chicken Curry", price: 18, category: "main" },
          ];

    // Format menu items to match the expected format and calculate tax
    const formattedMenu = await Promise.all(
      menu.map(async (item) => {
        const formattedItem = {
          id: item._id || item.id,
          name: item.name,
          price: item.price,
          category: item.category || "main",
          taxExempt: item.taxExempt || false,
        };

        // Add tax information
        formattedItem.tax = await calculateItemTax(formattedItem);
        formattedItem.priceWithTax = Number(
          (formattedItem.price + formattedItem.tax).toFixed(2)
        );

        return formattedItem;
      })
    );

    // Use either database user or Auth0 user
    const user = req.user || req.oidc.user;

    res.render("order", {
      user: user,
      menu: formattedMenu,
      taxConfig: taxConfig,
      title: "Order Food",
      active: "order",
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    // Fallback to default menu if there's an error
    const taxConfig = await getTaxConfig();
    const menu = [
      { id: 1, name: "Vegetarian Thali", price: 12, category: "main" },
      { id: 2, name: "Non-Vegetarian Thali", price: 15, category: "main" },
      { id: 3, name: "Paneer Masala", price: 12, category: "main" },
      { id: 4, name: "Chicken Curry", price: 18, category: "main" },
    ];

    // Calculate tax for each item
    const formattedMenu = await Promise.all(
      menu.map(async (item) => {
        const formattedItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          taxExempt: false,
        };

        // Add tax information
        formattedItem.tax = await calculateItemTax(formattedItem);
        formattedItem.priceWithTax = Number(
          (formattedItem.price + formattedItem.tax).toFixed(2)
        );

        return formattedItem;
      })
    );

    const user = req.user || req.oidc.user;

    res.render("order", {
      user: user,
      menu: formattedMenu,
      taxConfig: taxConfig,
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

    const { items, deliveryAddress, subtotal, taxAmount, totalPrice } =
      req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || !deliveryAddress) {
      return res.status(400).json({ error: "Invalid order details" });
    }

    // Basic validation
    const validationErrors = [];

    // At least one item
    if (items.length === 0) {
      validationErrors.push({
        rule: "minimumOrderItems",
        message: "Order must contain at least one item",
      });
    }

    // Delivery address must be at least 10 characters
    if (deliveryAddress.length < 10) {
      validationErrors.push({
        rule: "deliveryAddressLength",
        message: "Delivery address must be at least 10 characters long",
      });
    }

    // Each item quantity must be 10 or less
    if (items.some((item) => item.quantity > 10)) {
      validationErrors.push({
        rule: "itemQuantityLimit",
        message: "Maximum quantity per item is 10",
      });
    }

    // Minimum order value
    if (subtotal < 5) {
      validationErrors.push({
        rule: "minimumOrderValue",
        message: "Minimum order value is $5 (before tax)",
      });
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Order validation failed",
        validationErrors: validationErrors,
      });
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

    // Create order with the provided tax and pricing information
    const order = new Order({
      user: userId,
      items: items,
      subtotal: subtotal,
      taxAmount: taxAmount,
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

    // Get current tax configuration for rendering
    const taxConfig = await getTaxConfig();

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
          taxConfig: taxConfig,
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
      taxConfig: taxConfig,
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
