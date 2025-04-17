const User = require("../models/User");

// Middleware to check if the user is authenticated with Auth0
const authMiddleware = async (req, res, next) => {
  try {
    // Check if the user is authenticated using Auth0
    if (!req.oidc.isAuthenticated()) {
      return res.redirect("/login");
    }

    // Get Auth0 user
    const auth0User = req.oidc.user;

    // Find or create user in our database
    let user = await User.findOne({ email: auth0User.email });

    if (!user) {
      // Create a new user if not found
      user = await User.create({
        username:
          auth0User.nickname || auth0User.name || auth0User.email.split("@")[0],
        email: auth0User.email,
        password: Math.random().toString(36).slice(-10), // Random password since Auth0 handles auth
        auth0Id: auth0User.sub,
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.redirect("/login");
  }
};

// Middleware to attach user to response locals for templates
const setUserLocals = (req, res, next) => {
  if (req.oidc && req.oidc.isAuthenticated()) {
    res.locals.user = req.oidc.user;
  } else {
    res.locals.user = null;
  }
  next();
};
module.exports = { authMiddleware, setUserLocals };
