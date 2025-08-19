const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const userModel = require("../models/user-model");
const generateToken = require("../utils/generateToken");



let registerUser = async (req, res) => {
    try {
    let { Fullname, Email, Password } = req.body;
    let user = await userModel.findOne({ Email });
    if (user) {
        req.flash('error', 'User already exists with this email');
        return res.redirect('/users/register');
    }
    if (!Fullname || !Email || !Password) {
      req.flash('error', 'Please fill all the fields');
      return res.redirect('/users/register');
    }
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(Password, salt, async function (err, hash) {
        if (err) {
          req.flash('error', 'Error creating account');
          return res.redirect('/users/register');
        }

        let newUser = await userModel.create({
          Fullname,
          Email,
          Password: hash,
        });

        const token = generateToken(newUser);
        res.cookie("token", token);
        req.flash('success', 'Account created successfully!');
        return res.redirect('/shop');
      });
    });
  } catch (err) {
    req.flash('error', 'Registration failed');
    res.redirect('/users/register');
  }
};


let loginUser = async (req, res) => {
    try {
        let { Email, Password } = req.body;
        
        let user = await userModel.findOne({ Email });
        if (!user) {
            req.flash('error', 'No user found with this email');
            return res.redirect('/users/login');
        }
        bcrypt.compare(Password, user.Password, function (err, result) {
          if (err) {
            req.flash('error', 'Something went wrong');
            return res.redirect('/users/login');
          }
          if (!result) {
            req.flash('error', 'Invalid credentials');
            return res.redirect('/users/login');
          }
          const token = generateToken(user);
          res.cookie("token", token);
          req.session.user = user; 
          req.flash("success", "Logged in successfully!");
          res.redirect("/shop");
        });

    }
    catch (err) {
        req.flash('error', 'Login failed');
        res.redirect('/users/login');
    }
}


let logout = (req, res) => {
  res.clearCookie('token');
  req.session.destroy((err) => {
    if (err) return res.render('login', { users: null, loggedIn: false, error: 'Logout failed' });
    res.redirect('/users/login');
  });
};



module.exports = {registerUser, loginUser, logout};