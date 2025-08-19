const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const { registerUser, loginUser, logout } = require("../controllers/authController");
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const userModel = require("../models/user-model");

dotenv.config();


router.get('/register', (req, res) => res.render('register', { users: null, loggedIn: false }));
router.post("/register", registerUser);
router.get('/login', (req, res) => res.render('login', { users: null, loggedIn: false }));
router.post("/login", loginUser);
router.get('/logout', (req, res) => res.render('login', { users: null, loggedIn: false }));
router.post('/logout', logout);
router.post("/cart/add/:productId", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    let existingItem = user.cart.find(item => item.product && item.product.toString() === req.params.productId);
    
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 0) + 1;
    } else {
      user.cart.push({ product: req.params.productId, quantity: 1 });
    }
    
    await user.save();
    res.json({ success: true, message: "Product added to cart" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/cart", isLoggedIn, async (req, res) => {
  res.redirect(`/users/cart/${req.user._id}`);
});

router.get("/cart/:id", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findById(req.user._id);
    if (!user) {
      return res.redirect("/users/login");
    }
    
    // Manually populate cart items with product details
    const productModel = require("../models/product-model");
    const populatedCart = [];
    
    for (let cartItem of user.cart) {
      const product = await productModel.findById(cartItem.product);
      if (product) {
        populatedCart.push({
          product: product,
          quantity: cartItem.quantity || 1
        });
      }
    }
    
    res.render("cart", { cart: populatedCart, users: user, loggedIn: !!req.user });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.post("/cart/update/:productId", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findById(req.user._id);
    if (!user) {
      return res.redirect("/users/cart/" + req.user._id);
    }
    
    let cartItem = user.cart.find(item => item.product && item.product.toString() === req.params.productId);
    if (cartItem) {
      let newQuantity = parseInt(req.body.quantity);
      if (newQuantity <= 0) {
        // Remove item if quantity is 0 or less
        user.cart = user.cart.filter(item => item.product.toString() !== req.params.productId);
      } else {
        cartItem.quantity = newQuantity;
      }
      await user.save();
    }
    res.redirect("/users/cart/" + req.user._id);
  } catch (err) {
    res.redirect("/users/cart/" + req.user._id);
  }
});

router.post("/cart/remove/:productId", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findById(req.user._id);
    if (!user) {
      return res.redirect("/users/cart/" + req.user._id);
    }
    
    user.cart = user.cart.filter(item => item.product && item.product.toString() !== req.params.productId);
    await user.save();
    res.redirect("/users/cart/" + req.user._id);
  } catch (err) {
    res.redirect("/users/cart/" + req.user._id);
  }
});

module.exports = router;