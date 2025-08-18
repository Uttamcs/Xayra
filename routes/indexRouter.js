const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const { shop, confirmOrder } = require("../controllers/shop");
const productModel = require("../models/product-model");

router.get("/", (req, res) => {
  res.render("index", {
    loggedIn: !!req.cookies.token,
    users: null, 
  });
});
router.get("/shop", isLoggedIn, async(req, res) => {
    try {
      let query = {};
      let sort = {};
      
      // Apply filters
      if (req.query.discount === 'true') {
        query.discount = { $gt: 0 };
      }
      
      // Apply sorting
      switch(req.query.sortby) {
        case 'price-asc':
          sort.price = 1;
          break;
        case 'price-desc':
          sort.price = -1;
          break;
        case 'newest':
          sort.createdAt = -1;
          break;
        default:
          sort.name = 1;
      }
      
      let products = await productModel.find(query).sort(sort);
      const userModel = require("../models/user-model");
      let user = null;
      if (req.user) {
        user = await userModel.findById(req.user._id);
      }
      res.render("shop", { 
        products: products, 
        loggedIn: !!req.user, 
        users: user || req.user,
        currentSort: req.query.sortby || 'popular',
        showDiscounted: req.query.discount === 'true'
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
});
router.get("/shop/:id", isLoggedIn, async (req, res) => {
  try {
    let id = req.params.id;
    let product = await productModel.findById(id);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    res.render("productDesc", { product , loggedIn: !!req.user, users: user || req.user});
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
router.post("/shop", isLoggedIn, shop);
router.get("/checkout/:id", isLoggedIn, async (req, res) => {
  try {
    let product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    res.render("checkout", { product, loggedIn: true, users: user || req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
router.post("/order/confirm/:id", isLoggedIn, confirmOrder);

router.get("/success", (req, res) => {
  res.render("success", { loggedIn: !!req.cookies.token, users: null });
});

router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    res.render("profile", { users: user, loggedIn: !!req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    res.render("profile", { users: user, loggedIn: !!req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/order/confirm-cart", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    
    if (!user || user.cart.length === 0) {
      return res.redirect("/shop");
    }
    
    // Create order object
    const order = {
      _id: new Date().getTime().toString(),
      items: user.cart,
      fullName: req.body.fullName,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      pincode: req.body.pincode,
      paymentMethod: req.body.paymentMethod,
      status: "Pending",
      date: new Date()
    };
    
    // Add order to user's orders array
    user.orders.push(order);
    
    // Save phone number to user profile if provided
    if (req.body.phone) {
      user.Phone = req.body.phone;
    }
    
    // Clear the cart after order confirmation
    user.cart = [];
    await user.save();
    
    // Redirect to success page
    res.redirect("/success");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/checkout", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    if (!user || user.cart.length === 0) {
      return res.redirect("/shop");
    }
    
    // Populate cart items with product details
    const populatedCart = [];
    for (let cartItem of user.cart) {
      const product = await productModel.findById(cartItem.product || cartItem);
      if (product) {
        populatedCart.push({
          product: product,
          quantity: cartItem.quantity || 1
        });
      }
    }
    
    res.render("checkout", { cart: populatedCart, users: user, loggedIn: !!req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/about", (req, res) => {
  res.render("about", { loggedIn: !!req.cookies.token, users: null });
});

router.get("/contact", (req, res) => {
  res.render("contact", { loggedIn: !!req.cookies.token, users: null });
});

router.post("/profile/update", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    const bcrypt = require("bcrypt");
    
    let user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    
    // Update basic info
    user.Fullname = req.body.fullname;
    user.Email = req.body.email;
    if (req.body.phone) {
      user.Phone = req.body.phone;
    }
    
    // Update password if provided
    if (req.body.password && req.body.password.trim() !== '') {
      if (!req.body.currentPassword) {
        return res.status(400).send("Current password is required to change password");
      }
      
      const isValidPassword = await bcrypt.compare(req.body.currentPassword, user.Password);
      if (!isValidPassword) {
        return res.status(400).send("Current password is incorrect");
      }
      
      const salt = await bcrypt.genSalt(10);
      user.Password = await bcrypt.hash(req.body.password, salt);
    }
    
    await user.save();
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
