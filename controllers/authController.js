const bcrypt = require("bcrypt");
const userModel = require("../models/user-model");
const generateToken = require("../utils/generateToken");


let registerUser = async (req, res) => {
    try {
    let { Fullname, Email, Password } = req.body;
    let user = await userModel.findOne({ Email });
    if (user) {
        req.flash("error", "User already exists");
        return res.redirect("/users/register");
    }
    if (!Fullname || !Email || !Password) {
      return res.status(400).send("Please fill all the fields");
    }
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(Password, salt, async function (err, hash) {
        if (err) return res.status(500).send("Error hashing password");

        let newUser = await userModel.create({
          Fullname,
          Email,
          Password: hash,
        });

        const token = generateToken(newUser);
        res.cookie("token", token);
        return res.status(201).send("User registered successfully");
      });
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};


let loginUser = async (req, res) => {
    try {
        let { Email, Password } = req.body;
        
        let user = await userModel.findOne({ Email });
        if (!user) {
            return res.status(400).send("No user found");
        }
        bcrypt.compare(Password, user.Password, function (err, result) {
            if (err) return res.status(500).send("Something went wrong");
            if (!result) return res.status(400).send("Invalid credentials");
            const token = generateToken(user);
            res.cookie("token", token);
            req.flash("success", "Logged in successfully!");
            res.redirect("/users/shop");
        });

    }
    catch (err) {
        res.status(500).send(err.message);
    }
}


let logout = async (req, res) => {
    try {
        res.clearCookie("token");
        req.flash("success", "Logged out successfully!");
        res.redirect("/users/login");
    }
    catch (err) {
        res.status(500).send(err.message);
    }
}


module.exports = {registerUser, loginUser, logout};