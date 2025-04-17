const User = require("../models/User");

exports.getHomePage = async (req, res) => {
  try {
    // Check if the user is authenticated with Auth0
    if (req.oidc && req.oidc.isAuthenticated()) {
      // If there's a database user, use it, otherwise use Auth0 user info
      if (req.user) {
        res.render("home", {
          user: req.user,
          title: "Home",
          active: "home",
        });
      } else {
        // Use Auth0 user info directly
        res.render("home", {
          user: req.oidc.user,
          title: "Home",
          active: "home",
        });
      }
    } else {
      // No authenticated user
      res.render("home", {
        user: null,
        title: "Home",
        active: "home",
      });
    }
  } catch (error) {
    res.status(500).render("error", {
      error: error.message,
      user: req.oidc ? req.oidc.user : null,
      title: "Error",
      active: "",
    });
  }
};

exports.getAboutPage = (req, res) => {
  res.render("about", {
    user: req.oidc ? req.oidc.user : null,
    title: "About Us",
    active: "about",
  });
};

exports.getContactPage = (req, res) => {
  res.render("contact", {
    user: req.oidc ? req.oidc.user : null,
    title: "Contact Us",
    active: "contact",
  });
};
