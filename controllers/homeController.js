exports.homePage = (req, res) => {
  res.render("home", {
    username: req.user.username,
  });
};
