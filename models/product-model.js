const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    image: Buffer,
    brand: String,
    color: String,
    name: String,
    price: Number,
    discount: {
        type: Number,
        default: 0
    },
})


module.exports = mongoose.model("product", productSchema);