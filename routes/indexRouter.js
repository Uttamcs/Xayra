const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const { shop, confirmOrder } = require("../controllers/shop");
const productModel = require("../models/product-model");
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
});

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
      
      // Apply search
      if (req.query.search) {
        query.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { brand: { $regex: req.query.search, $options: 'i' } },
          { color: { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
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
        showDiscounted: req.query.discount === 'true',
        searchQuery: req.query.search || ''
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Unable to load products. Please try again.');
      res.render("shop", { 
        products: [], 
        loggedIn: !!req.user, 
        users: req.user,
        currentSort: 'popular',
        showDiscounted: false,
        searchQuery: ''
      });
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
    req.flash('error', 'Product not found or unavailable.');
    res.redirect('/shop');
  }
});
router.post("/shop", isLoggedIn, shop);
router.get("/checkout/:id", isLoggedIn, async (req, res) => {
  try {
    let product = await productModel.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/shop');
    }
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    res.render("checkout", { product, loggedIn: true, users: user || req.user });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to load checkout page.');
    res.redirect('/shop');
  }
});
router.post("/order/confirm/:id", isLoggedIn, confirmOrder);

router.get("/success", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    res.render("success", { loggedIn: !!req.user, users: user });
  } catch (err) {
    res.render("success", { loggedIn: !!req.user, users: null });
  }
});

router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    res.render("profile", { users: user, loggedIn: !!req.user });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to load profile.');
    res.redirect('/shop');
  }
});

router.post("/order/confirm-cart", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    
    if (!user || user.cart.length === 0) {
      return res.redirect("/shop");
    }
    
    // Initialize orders array if it doesn't exist
    if (!user.orders) {
      user.orders = [];
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
      deliveryTime: req.body.deliveryTime || 'anytime',
      status: req.body.paymentStatus || "Pending",
      date: new Date()
    };
    
    // Add order to user's orders array
    user.orders.push(order);
    req.flash('success', 'Order placed successfully!');
    
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

// Razorpay create order
router.post("/create-order", isLoggedIn, async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}`
    };
    
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Razorpay verify payment
router.post("/verify-payment", isLoggedIn, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
    
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");
    
    if (razorpay_signature === expectedSign) {
      // Save order if orderData is provided
      if (orderData) {
        const userModel = require("../models/user-model");
        let user = await userModel.findById(req.user._id);
        
        if (!user.orders) user.orders = [];
        
        const order = {
          _id: new Date().getTime().toString(),
          items: user.cart,
          fullName: orderData.fullName,
          phone: orderData.phone,
          address: orderData.address,
          city: orderData.city,
          pincode: orderData.pincode,
          paymentMethod: 'razorpay',
          deliveryTime: orderData.deliveryTime || 'anytime',
          status: 'Paid',
          paymentId: razorpay_payment_id,
          date: new Date()
        };
        
        user.orders.push(order);
        if (orderData.phone) user.Phone = orderData.phone;
        user.cart = [];
        await user.save();
      }
      
      res.json({ status: "Payment Verified", redirect: "/success" });
    } else {
      res.json({ status: "Payment Failed" });
    }
  } catch (error) {
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// User order history
router.get("/orders", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    
    // Sort orders by date (newest first)
    if (user.orders) {
      user.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    res.render("user-orders", { orders: user.orders || [], users: user, loggedIn: !!req.user });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to load order history.');
    res.redirect('/profile');
  }
});

// Razorpay checkout page
router.get("/razorpay-checkout", isLoggedIn, async (req, res) => {
  try {
    const userModel = require("../models/user-model");
    let user = await userModel.findById(req.user._id);
    res.render("razorpay-checkout", { users: user, loggedIn: !!req.user });
  } catch (err) {
    console.error(err);
    res.redirect('/shop');
  }
});

module.exports = router;