const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owners-model');
const dotenv = require('dotenv');
dotenv.config();
console.log("NODE_ENV:", process.env.NODE_ENV);

router.get('/', (req, res) => {
    return res.render('owner-login', { users: null });
});
router.get('/login', (req, res) => {
    return res.render('owner-login', { users: null });
})
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    ownerModel.findOne({ Email: email })
        .then(user => {
            if (user) {
                if (user.Password === password) {
                    console.log(user.Password+" "+password);
                    req.session.user = user;
                    res.redirect("/owners/admin", { users: null });
                } else {
                    req.flash('error', 'Incorrect password');
                    res.redirect('/owners/login');
                }
            } else {
                req.flash('error', 'User not found');
                res.redirect('/owners/login');
            }
        })
        .catch(err => {
            console.error(err);
            req.flash('error', 'An error occurred');
            res.redirect('/owners/login');
        });
});

router.get('/admin', function (req, res) {
    let success = req.flash('success');
    let error = req.flash('error');
    res.render('createproducts', {success, error, users: null});
});


module.exports = router;