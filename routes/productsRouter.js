const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");

// Admin authentication middleware
function isAdmin(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/owners/login');
    }
}

router.get("/", isAdmin, async (req, res) => {
    try {
        let products = await productModel.find();
        res.render("admin-products", { products, users: req.session.user, isAdmin: true });
    } catch (error) {
        req.flash("error", "Unable to fetch products");
        res.redirect("/owners/admin");
    }
});

router.get("/create", isAdmin, function (req, res) {
    let success = req.flash("success");
    let error = req.flash("error");
    res.render("createproducts", { success, error, users: req.session.user, isAdmin: true });
});

router.post("/create", isAdmin, upload.single("image"), async (req, res) => {
    try {
        let { name, price, brand, color, discount } = req.body;

        let product = await productModel.create({
            image: req.file.buffer,
            brand: capitalizeWords(brand),
            color: capitalizeWords(color),
            name: capitalizeWords(name),
            price: price,
            discount: discount,
        });
        req.flash("success", "Product created successfully");
        res.redirect("/products");
    } catch (error) {
        req.flash("error", "Unable to add...\n Something went Wrong");
        return res.redirect("/products/create");
    }
});

router.delete("/delete/:id", isAdmin, async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

function capitalizeWords(str) {
    return str.replace(
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );
}

module.exports = router;
