const User = require("../models/User");
const { auth } = require("express-openid-connect");
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  routes: {
    login: "/login",
    logout: "/logout",
    callback: "/callback",
  },
};
exports.authConfig = auth(config);

exports.registerPage = (req, res) => {
  return res.redirect("/login");
};

exports.loginPage = (req, res) => {
  if (req.oidc.isAuthenticated()) {
    return res.redirect("/home");
  }
  res.oidc.login({ returnTo: "/home" });
};

exports.callback = async (req, res) => {
  try {
    if (req.oidc.isAuthenticated()) {
      const auth0User = req.oidc.user;
      let user = await User.findOne({ email: auth0User.email });

      if (!user) {
        user = await User.create({
          username:
            auth0User.nickname ||
            auth0User.name ||
            auth0User.email.split("@")[0],
          email: auth0User.email,
          // We don't need to store the password as Auth0 handles authentication
          password: Math.random().toString(36).slice(-10), // Random password since we won't use it
          auth0Id: auth0User.sub, // Store Auth0 user ID
        });
      }
      res.redirect("/login");
    }
  } catch (error) {
    console.log("Auth0 callback error:", error);
    res.redirect("/login");
  }
};
exports.logout = (req, res) => {
  res.oidc.logout({ returnTo: process.env.AUTH0_BASE_URL });
};

// Profile route to get user info
exports.profile = (req, res) => {
  res.json(req.oidc.user);
};
