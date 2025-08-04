const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");

module.exports.isLoggedIn = async (req, res, next) =>{
    if (!req.cookies.token) {
        req.flash("error", "Please login to continue");
        return res.redirect("/users/login");
    }

    try {
        let decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
        let user = await userModel.findOne({ Email: decoded.Email }).select("-Password");
        if (!user) {
            req.flash("error", "Please login to continue");
            return res.redirect("/users/login");
        }
        req.user = user;
        next();
    } catch (err) {
        req.flash("error", "Something went Wrong");
        return res.redirect("/");
    }
};