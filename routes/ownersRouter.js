const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owners-model');
const userModel = require('../models/user-model');
const dotenv = require('dotenv');
dotenv.config();

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.Email) {
        ownerModel.findOne({ Email: req.session.user.Email })
            .then(owner => {
                if (owner) {
                    next();
                } else {
                    req.flash('error', 'Access denied. Admin privileges required.');
                    res.redirect('/owners/login');
                }
            })
            .catch(err => {
                req.flash('error', 'Authentication error.');
                res.redirect('/owners/login');
            });
    } else {
        req.flash('error', 'Please login as admin.');
        res.redirect('/owners/login');
    }
}

router.get('/', (req, res) => {
    let success = req.flash('success');
    let error = req.flash('error');
    return res.render('owner-login', { users: null, success, error, loggedIn: false });
});

router.get('/login', (req, res) => {
    let success = req.flash('success');
    let error = req.flash('error');
    return res.render('owner-login', { users: null, success, error, loggedIn: false });
});

router.get('/create-admin', async (req, res) => {
    try {
        const existingOwner = await ownerModel.findOne({});
        if (existingOwner) {
            return res.send('Admin already exists');
        }
        
        const newOwner = new ownerModel({
            Fullname: 'Admin',
            Email: 'uk89197@gmail.com',
            Password: '123',
            Phone: 1234567890
        });
        
        await newOwner.save();
        res.send(
          "Admin created successfully! Email: uk89197@gmail.com, Password: 123"
        );
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating admin');
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await ownerModel.findOne({ Email: email });
        
        if (user) {
            if (user.Password === password) {
                req.session.user = user;
                req.flash('success', 'Login successful');
                res.redirect("/owners/admin");
            } else {
                req.flash('error', 'Incorrect password');
                res.redirect('/owners/login');
            }
        } else {
            req.flash('error', 'Admin account not found');
            res.redirect('/owners/login');
        }
    } catch (err) {
        req.flash('error', 'An error occurred during login');
        res.redirect('/owners/login');
    }
});

router.get('/admin', isAdmin, async function (req, res) {
    try {
        let success = req.flash('success');
        let error = req.flash('error');
        
        const productModel = require('../models/product-model');
        const users = await userModel.find({});
        const products = await productModel.find({});
        
        // Calculate statistics
        let totalOrders = 0;
        let totalRevenue = 0;
        let recentOrders = [];
        let pendingOrders = 0;
        
        users.forEach(user => {
            if (user.orders) {
                user.orders.forEach(order => {
                    totalOrders++;
                    if (order.status === 'Pending') pendingOrders++;
                    
                    // Calculate revenue from order items
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            if (typeof item === 'object' && item.price) {
                                totalRevenue += item.price * (item.quantity || 1);
                            }
                        });
                    }
                    
                    recentOrders.push({
                        ...order._doc || order,
                        customerName: user.Fullname,
                        customerEmail: user.Email
                    });
                });
            }
        });
        
        recentOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        recentOrders = recentOrders.slice(0, 5);
        
        const stats = {
            totalUsers: users.length,
            totalProducts: products.length,
            totalOrders,
            totalRevenue,
            pendingOrders
        };
        
        res.render('admin-dashboard', {
            success, error, 
            users: req.session.user, 
            recentOrders, 
            stats,
            isAdmin: true
        });
    } catch (err) {
        req.flash('error', 'Error loading admin panel');
        res.render('admin-dashboard', {
            success: [], error: req.flash('error'), 
            users: null, 
            recentOrders: [], 
            stats: { totalUsers: 0, totalProducts: 0, totalOrders: 0, pendingOrders: 0 }
        });
    }
});

// Order management route
router.get('/orders', isAdmin, async (req, res) => {
    try {
        let success = req.flash('success');
        let error = req.flash('error');
        
        const users = await userModel.find({});
        let allOrders = [];
        
        users.forEach(user => {
            if (user.orders && user.orders.length > 0) {
                user.orders.forEach(order => {
                    allOrders.push({
                        ...order._doc || order,
                        customerName: user.Fullname,
                        customerEmail: user.Email,
                        customerId: user._id
                    });
                });
            }
        });
        

        
        // Sort by date (newest first)
        allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.render('admin-orders', { 
            orders: allOrders, 
            users: req.session.user, 
            isAdmin: true, 
            success: success || [], 
            error: error || [] 
        });
    } catch (err) {
        req.flash('error', 'Unable to load orders.');
        res.redirect('/owners/admin');
    }
});

// Update order status
router.post('/orders/update/:userId/:orderId', isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];
        
        if (!validStatuses.includes(status)) {
            req.flash('error', 'Invalid order status.');
            return res.redirect('/owners/orders');
        }
        
        const user = await userModel.findById(req.params.userId);
        
        if (user && user.orders) {
            const orderIndex = user.orders.findIndex(o => 
                (o._id && o._id.toString() === req.params.orderId) || 
                (o._id === req.params.orderId)
            );
            
            if (orderIndex !== -1) {
                user.orders[orderIndex].status = status;
                user.markModified('orders');
                await user.save();
                req.flash('success', `Order status updated to ${status}`);
            } else {
                req.flash('error', 'Order not found.');
            }
        } else {
            req.flash('error', 'User not found.');
        }
        
        res.redirect('/owners/orders');
    } catch (err) {
        req.flash('error', 'Failed to update order status.');
        res.redirect('/owners/orders');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/owners/login');
});


module.exports = router;