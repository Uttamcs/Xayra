let shop = async (req, res) => {
  try {
    res.render("shop", {products:[]});
  } catch (err) {
    res.status(500).send(err.message);
  }
};

let confirmOrder = async (req, res) => {
  try {
    const productModel = require("../models/product-model");
    const userModel = require("../models/user-model");
    
    let product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    
    let user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).send("User not found");

    // Initialize orders array if it doesn't exist
    if (!user.orders) {
      user.orders = [];
    }
    
    // Create order object
    const order = {
      _id: new Date().getTime().toString(),
      items: [{ product: product._id, quantity: 1 }],
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
    
    // Save phone number to user profile if provided
    if (req.body.phone) {
      user.Phone = req.body.phone;
    }
    
    await user.save();
    
    res.redirect("/success");
  } catch (err) {
    res.status(500).send("Server Error");
  }
};


module.exports = {shop, confirmOrder};