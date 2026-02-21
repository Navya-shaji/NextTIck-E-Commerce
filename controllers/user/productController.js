const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Coupon = require("../../models/couponSchema");
const Review = require("../../models/reviewSchema");
const Order = require("../../models/orderSchema");

//productDetails............................................

const productDetail = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const productId = req.query.id;

        // Fetch product with category
        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.redirect("/pageNotFound");
        }

        const findCategory = product.category;

        // Fetch related products from same category
        const relatedProducts = await Product.find({
            category: findCategory._id,
            _id: { $ne: productId },
            quantity: { $gt: 0 },
            isBlocked: false
        }).limit(4);

        // Calculate offers
        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = Math.max(categoryOffer, productOffer);

        // Fetch available coupons
        const availableCoupons = await Coupon.find({
            expireOn: { $gt: new Date() },
            isActive: true,
            $or: [
                { applicableProducts: productId },
                { applicableCategories: findCategory._id }
            ]
        });

        // Fetch reviews for this product
        const reviews = await Review.find({ productId }).sort({ createdOn: -1 });

        res.render("productDetails", {
            user: userData,
            product: product,
            quantity: product.quantity,
            totalOffer: totalOffer,
            category: findCategory,
            relatedProducts,
            availableCoupons,
            reviews
        });

    } catch (error) {
        console.error("Error fetching product details:", error);
        res.redirect("/pageNotFound");
    }
};

const addReview = async (req, res) => {
    try {
        const userDataFromSession = req.session.user ?? req.session.passport?.user;
        if (!userDataFromSession) {
            return res.status(401).json({ success: false, message: "Please login to add a review" });
        }

        const userId = userDataFromSession._id;
        const { productId, rating, comment, orderId } = req.body;

        if (!productId || !rating || !comment || !orderId) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // 1. Check if this user already reviewed this product (Application level check)
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this product. Only one review per product is allowed."
            });
        }

        // 2. Verify that the user actually purchased this product in the given order
        const order = await Order.findOne({
            _id: orderId,
            userId: userId,
            "orderItems.product": productId
        });

        if (!order) {
            return res.status(403).json({
                success: false,
                message: "You can only review products you have purchased."
            });
        }

        // 3. Optional: Verify product was delivered
        const item = order.orderItems.find(i => i.product.toString() === productId);
        if (item.status !== 'Delivered' && order.status !== 'Delivered') {
            return res.status(403).json({
                success: false,
                message: "You can only review products that have been delivered."
            });
        }

        const user = await User.findById(userId);
        const newReview = new Review({
            productId,
            userId,
            userName: user.name,
            rating: parseInt(rating),
            comment,
            orderId
        });

        await newReview.save();

        res.json({ success: true, message: "Review submitted successfully" });
    } catch (error) {
        console.error("Error adding review:", error);
        // E11000: duplicate key — user tried to submit a second review (race condition safety net)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this product. Only one review per product is allowed."
            });
        }
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    productDetail,
    addReview
};
