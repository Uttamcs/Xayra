const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owners-model');
const dotenv = require('dotenv');
dotenv.config();
console.log("NODE_ENV:", process.env.NODE_ENV);

router.get('/', (req, res) => {
    res.send('Hey owners');
});

router.get('/admin', function (req, res) {
    let success = req.flash('success');
    let error = req.flash('error');
    res.render('createproducts', {success, error});
});


module.exports = router;