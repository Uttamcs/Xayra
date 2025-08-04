const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const { registerUser, loginUser, logout } = require("../controllers/authController");
const { shop } = require("../controllers/shop");
const { isLoggedIn } = require("../middlewares/isLoggedIn");

dotenv.config();


router.get("/", (req, res) => {
    res.send("Hey users");
});
router.get('/register', (req, res) => res.render('register'));
router.post("/register", registerUser);
router.get('/login', (req, res) => res.render('login'));
router.post("/login", loginUser);
router.get('/shop',isLoggedIn, (req, res) => res.render('shop', {products:[]}));
router.post('/shop', shop);
router.get('/logout', logout);
module.exports = router;