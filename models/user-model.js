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
  cart: {
    type: Array,
    default: [],
  },
  picture: String,
});
  

module.exports = mongoose.model("user", userSchema);