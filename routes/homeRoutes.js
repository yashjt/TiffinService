// const express = require("express");
// const homeController = require("../controllers/homeController");
// const authMiddleware = require("../middleware/authMiddleware");

// const router = express.Router();
// router.get("/", homeController.getHomePage);
// router.get("/home", authMiddleware, homeController.getHomePage);
// module.exports = router;
const express = require("express");
const homeController = require("../controllers/homeController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Apply a modified middleware to the root route that doesn't redirect
router.get(
  "/",
  (req, res, next) => {
    // Get token from cookie
    const token = req.cookies.jwt;

    // If token exists, try to authenticate the user but don't redirect
    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const User = require("../models/User");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user and attach to request
        User.findById(decoded.id)
          .then((user) => {
            if (user) {
              req.user = user;
            }
            next();
          })
          .catch((err) => {
            next();
          });
      } catch (error) {
        next();
      }
    } else {
      next();
    }
  },
  homeController.getHomePage
);

// Keep the protected home route
router.get("/home", authMiddleware, homeController.getHomePage);

// Add other routes
router.get("/about", homeController.getAboutPage);
router.get("/contact", homeController.getContactPage);

module.exports = router;
