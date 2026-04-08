const mongoose = require("mongoose");
const Coupon = require("../../models/couponSchema");
const Category = require("../../models/categorySchema");

const loadcoupon = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalCoupons = await Coupon.countDocuments();
        const totalPages = Math.ceil(totalCoupons / limit);

        const categories = await Category.find({ isListed: true }).sort({ name: 1 });
        
        const coupons = await Coupon.find()
            .populate('applyToCategories', 'name')
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit);

        res.render('coupon', {
            coupons,
            categories,
            currentPage: page,
            totalPages,
            limit
        });
    } catch (error) {
        console.error("Error loading coupons:", error);
        return res.redirect("/pageNotFound");
    }
};

const getCoupon = async (req, res) => {
    try {
        const id = req.query.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: false, message: "Invalid coupon ID." });
        }
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ status: false, message: "Coupon not found." });
        }
        res.status(200).json({ status: true, coupon });
    } catch (error) {
        console.error("Error fetching coupon:", error);
        res.status(500).json({ status: false, message: "Internal server error." });
    }
};

const createCoupon = async (req, res) => {
    try {
        const { couponName, startDate, endDate, offerPrice, minimumPrice, maximumDiscount, couponType, globalUsageLimit, usagePerUser, applyToCategories } = req.body;

        if (!couponName || !startDate || !endDate || !offerPrice || !minimumPrice) {
            return res.status(400).json({ status: false, message: "All basic fields are required." });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ status: false, message: "Invalid dates provided." });
        }

        if (start < today) {
            return res.status(400).json({ status: false, message: "Start date cannot be in the past." });
        }

        if (end <= start) {
            return res.status(400).json({ status: false, message: "End date must be after start date." });
        }

        const parsedOfferPrice = parseFloat(offerPrice);
        const parsedMinPrice = parseFloat(minimumPrice);
        const parsedMaxDiscount = maximumDiscount ? parseFloat(maximumDiscount) : null;
        const parsedGlobalLimit = globalUsageLimit ? parseInt(globalUsageLimit) : null;
        const parsedUserLimit = usagePerUser ? parseInt(usagePerUser) : 1;

        // Validation Rules:
        if (parsedMinPrice < 100) {
            return res.status(400).json({ status: false, message: "Minimum purchase must be at least ₹100." });
        }

        if (couponType === 'percentage') {
            if (parsedOfferPrice < 1 || parsedOfferPrice > 90) {
                return res.status(400).json({ status: false, message: "Percentage discount must be between 1 and 90%." });
            }
        } else {
            if (parsedOfferPrice < 1 || parsedOfferPrice > 100000) {
                return res.status(400).json({ status: false, message: "Flat discount must be between ₹1 and ₹1,00,000." });
            }
            if (parsedOfferPrice >= parsedMinPrice) {
                return res.status(400).json({ status: false, message: "Offer price must be less than minimum purchase amount." });
            }
        }

        const existingCoupon = await Coupon.findOne({ name: { $regex: new RegExp("^" + couponName + "$", "i") } });
        if (existingCoupon) {
            return res.status(400).json({ status: false, message: "Coupon code already exists." });
        }

        const newCoupon = new Coupon({
            name: couponName.toUpperCase(),
            createdOn: start,
            expireOn: end,
            offerPrice: parsedOfferPrice,
            minimumPrice: parsedMinPrice,
            maximumDiscount: parsedMaxDiscount,
            couponType: couponType || 'flat',
            globalUsageLimit: parsedGlobalLimit,
            usagePerUser: parsedUserLimit,
            applyToCategories: Array.isArray(applyToCategories) ? applyToCategories : (applyToCategories ? [applyToCategories] : [])
        });

        await newCoupon.save();
        res.status(201).json({ status: true, message: "Coupon created successfully." });
    } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ status: false, message: "Internal server error." });
    }
};

const editCoupon = async (req, res) => {
    try {
        const id = req.query.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send("Invalid coupon ID.");
        }

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).send("Coupon not found.");
        }

        res.render("edit-coupon", { coupon });
    } catch (error) {
        console.error("Error loading coupon for edit:", error);
        res.status(500).send("Server error.");
    }
};

const updateCoupon = async (req, res) => {
    try {
        const id = req.query.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: false, message: "Invalid coupon ID." });
        }

        const { couponName, startDate, endDate, offerPrice, minimumPrice, maximumDiscount, couponType, globalUsageLimit, usagePerUser, applyToCategories } = req.body;
        if (!couponName || !startDate || !endDate || !offerPrice || !minimumPrice) {
            return res.status(400).json({ status: false, message: "Basic fields are required." });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ status: false, message: "Invalid dates provided." });
        }

        if (end <= start) {
            return res.status(400).json({ status: false, message: "End date must be after start date." });
        }

        const parsedOfferPrice = parseFloat(offerPrice);
        const parsedMinPrice = parseFloat(minimumPrice);
        const parsedMaxDiscount = maximumDiscount ? parseFloat(maximumDiscount) : null;
        const parsedGlobalLimit = globalUsageLimit ? parseInt(globalUsageLimit) : null;
        const parsedUserLimit = usagePerUser ? parseInt(usagePerUser) : 1;

        if (parsedMinPrice < 100) {
            return res.status(400).json({ status: false, message: "Minimum purchase must be at least ₹100." });
        }

        if (couponType === 'percentage') {
            if (parsedOfferPrice < 1 || parsedOfferPrice > 90) {
                return res.status(400).json({ status: false, message: "Percentage discount must be between 1 and 90%." });
            }
        } else {
            if (parsedOfferPrice < 1 || parsedOfferPrice > 100000) {
                return res.status(400).json({ status: false, message: "Flat discount must be between ₹1 and ₹1,00,000." });
            }
            if (parsedOfferPrice >= parsedMinPrice) {
                return res.status(400).json({ status: false, message: "Offer price must be less than minimum purchase amount." });
            }
        }

        const existingCoupon = await Coupon.findOne({ 
            name: { $regex: new RegExp("^" + couponName + "$", "i") },
            _id: { $ne: id }
        });
        if (existingCoupon) {
            return res.status(400).json({ status: false, message: "Coupon code already exists." });
        }

        const updateData = {
            name: couponName.toUpperCase(),
            createdOn: start,
            expireOn: end,
            offerPrice: parsedOfferPrice,
            minimumPrice: parsedMinPrice,
            maximumDiscount: parsedMaxDiscount,
            couponType: couponType || 'flat',
            globalUsageLimit: parsedGlobalLimit,
            usagePerUser: parsedUserLimit,
            applyToCategories: Array.isArray(applyToCategories) ? applyToCategories : (applyToCategories ? [applyToCategories] : [])
        };

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({ status: false, message: "Coupon not found." });
        }

        res.status(200).json({ status: true, message: "Coupon updated successfully." });
    } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ status: false, message: "Internal server error." });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid coupon ID." });
        }

        const deletedCoupon = await Coupon.findByIdAndDelete(id);

        if (deletedCoupon) {
            res.status(200).json({ success: true, message: "Coupon deleted successfully." });
        } else {
            res.status(404).json({ success: false, message: "Coupon not found." });
        }
    } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

module.exports = {
    loadcoupon,
    getCoupon,
    createCoupon,
    editCoupon,
    updateCoupon,
    deleteCoupon,
};

