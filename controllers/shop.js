const isLoggedIn = require("../middlewares/isLoggedIn")
let shop = async (req, isLoggedIn, res) => {
  try {
    res.render("shop");
  } catch (err) {
    res.status(500).send(err.message);
  }
};


module.exports = {shop };