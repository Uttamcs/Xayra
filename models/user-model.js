const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  Fullname: {
    type: String,
    required: true,
    trime: true,
  },
  Email: String,
  Password: String,
  isAdmin: Boolean,
  Phone: Number,
  orders: {
    type: Array,
    default: [],
  },
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product'
    },
    quantity: {
      type: Number,
      default: 1
    }
  }],
  picture: String,
});
  

module.exports = mongoose.model("user", userSchema);