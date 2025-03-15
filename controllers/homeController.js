const User = require("../models/User");

exports.getHomePage = async (req, res) => {
  try {
    const user = req.user ? await User.findById(req.user._id) : null;
    res.render("home", {
      user: user,
      title: "Home",
      active: "home",
    });
  } catch (error) {
    res.status(500).render("error", {
      error: error.message,
      user: req.user || null,
      title: "Error",
      active: "",
    });
  }
};

exports.getAboutPage = (req, res) => {
  res.render("about", {
    user: req.user || null,
    title: "About Us",
    active: "about",
  });
};

exports.getContactPage = (req, res) => {
  res.render("contact", {
    user: req.user || null,
    title: "Contact Us",
    active: "contact",
  });
};
