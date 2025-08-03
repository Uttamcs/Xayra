const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
    Fullname: {
        type: String,
        required: true, 
        trime: true,
    },
    Email: String,
    Password: String,
    product: {
        type: Array,
        default: []
    },
    Phone: Number, 
    picture: String,
    gstin : String,
});
  

module.exports = mongoose.model("owner", ownerSchema);