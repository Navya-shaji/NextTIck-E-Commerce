const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require('../../models/orderSchema');
const Coupon = require("../../models/couponSchema")
const Wallet = require("../../models/walletSchema");
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async (amount) => {
    try {
        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `order_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        throw new Error('Error creating Razorpay order: ' + error.message);
    }
};

const getcheckoutPage = async (req, res) => {
    try {
        const userId = req.session.user?._id || req.session.user || req.session.guestUserId;
        if (!userId) {
            return res.redirect("/signup?message=Please start shopping to proceed to checkout");
        }

        const user = await User.findById(userId);
        if (!user) return res.redirect("/signup");

        const wallet = await Wallet.findOne({ userId: user._id }) || { totalBalance: 0 };
        user.wallet = wallet.totalBalance || 0;

        const productId = req.query.id || null;
        const quantity = parseInt(req.query.quantity) || 1;

        const address = await Address.findOne({ userId: user._id });
        const addressData = address || { address: [] };

        const usedCouponNames = user.coupons ? user.coupons.map(c => c.couponName) : [];
        const availableCoupons = await Coupon.find({
            isList: true,
            expireOn: { $gt: new Date() },
            name: { $nin: usedCouponNames }
        });

        if (!productId) {
            const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");
            if (!cart || !cart.items || cart.items.length === 0) return res.redirect("/");

            const products = cart.items
                .filter(item => item.productId && item.productId._id)
                .map(item => {
                    const product = item.productId;
                    return {
                        _id: product._id,
                        productName: product.productName || 'Unknown Product',
                        productImage: Array.isArray(product.productImage) && product.productImage.length > 0 ? product.productImage : ["default-image.jpg"],
                        salesPrice: parseFloat(product.salesPrice || 0),
                        price: parseFloat(item.price || 0),
                        quantity: parseInt(item.quantity || 1),
                    };
                });

            if (products.length === 0) return res.redirect("/");

            const subtotal = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return res.render("checkout", {
                user,
                product: products,
                subtotal,
                quantity: null,
                addressData,
                availableCoupons,
                wallet,
            });
        }

        const product = await Product.findById(productId);
        if (!product) return res.redirect("/pageNotFound");

        const productData = {
            _id: product._id,
            productName: product.productName || 'Unknown Product',
            productImage: Array.isArray(product.productImage) && product.productImage.length > 0 ? product.productImage : ["default-image.jpg"],
            salesPrice: parseFloat(product.salesPrice || 0),
            quantity: parseInt(quantity)
        };

        const subtotal = productData.salesPrice * productData.quantity;

        return res.render("checkout", {
            user,
            product: [productData],
            subtotal,
            quantity,
            addressData,
            availableCoupons,
            wallet
        });

    } catch (error) {
        console.error("Error fetching checkout page:", error);
        return res.redirect("/pageNotFound");
    }
};

const calculateDeliveryCharge = (address) => 0;

const postCheckout = async (req, res) => {
    try {
        const userId = req.session.user?._id || req.session.user || req.session.guestUserId;
        if (!userId) return res.status(401).json({ success: false, message: "Session expired." });

        const { address, products, subtotal, total, paymentMethod, guestEmail } = req.body;
        const parsedProducts = JSON.parse(products);
        const parsedTotal = parseFloat(total);
        const parsedSubtotal = parseFloat(subtotal);

        const userAddressDoc = await Address.findOne({ userId });
        const selectedAddress = userAddressDoc?.address.find(addr => addr._id.toString() === address);
        if (!selectedAddress) return res.status(404).json({ success: false, message: "Address not found" });

        const shippingAddressString = `${selectedAddress.name}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`;

        if (paymentMethod === 'COD' && parsedTotal > 1000) {
            return res.status(400).json({ success: false, message: "COD not available for orders above Rs 1000" });
        }

        for (const pro of parsedProducts) {
            const product = await Product.findById(pro._id);
            if (!product || product.quantity < pro.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product?.productName || 'product'}` });
            }
            await Product.findByIdAndUpdate(pro._id, {
                $inc: { quantity: -pro.quantity, totalSalesCount: pro.quantity }
            });
        }

        const finalTotal = parsedTotal + calculateDeliveryCharge(address);
        const discountAmount = parsedSubtotal - parsedTotal;

        if (paymentMethod === 'Wallet') {
            const userWallet = await Wallet.findOne({ userId });
            if (!userWallet || userWallet.totalBalance < finalTotal) {
                return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
            }
            userWallet.totalBalance -= finalTotal;
            userWallet.transactions.push({
                type: 'Purchase',
                amount: -finalTotal,
                status: 'Completed',
                description: `Payment for Order`
            });
            await userWallet.save();
        }

        const orderedItems = parsedProducts.map(p => ({ product: p._id, price: p.salesPrice, quantity: p.quantity }));
        const couponCode = req.body.couponCode;
        const newOrder = new Order({
            userId,
            orderItems: orderedItems,
            address: userAddressDoc._id,
            shippingAddress: shippingAddressString,
            totalPrice: parsedSubtotal,
            finalAmount: finalTotal,
            discount: Math.max(0, discountAmount),
            couponApplied: discountAmount > 0,
            couponCode: discountAmount > 0 ? couponCode : null,
            status: "Pending",
            paymentMethod,
            paymentStatus: paymentMethod === 'Wallet' ? "Completed" : "Pending",
            guestEmail: guestEmail || null,
        });

        const savedOrder = await newOrder.save();

        if (paymentMethod === 'online') {
            const rzpOrder = await createRazorpayOrder(finalTotal);
            return res.status(200).json({
                success: true,
                order_id: rzpOrder.id,
                key_id: process.env.RAZORPAY_KEY_ID,
                amount: Math.round(finalTotal * 100),
                currency: "INR",
                orderId: savedOrder._id
            });
        }

        if (discountAmount > 0 && couponCode && paymentMethod !== 'online') {
            await User.findByIdAndUpdate(userId, {
                $push: { coupons: { couponName: couponCode, usedAt: new Date() } }
            });
        }

        await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

        return res.status(200).json({ success: true, message: "Order placed successfully", orderId: savedOrder._id });

    } catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user?._id || req.session.user || req.session.guestUserId;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generated_signature = hmac.digest('hex');

        if (generated_signature !== razorpay_signature) return res.status(400).json({ success: false, message: "Invalid signature" });

        const order = await Order.findByIdAndUpdate(orderDetails.orderId, { paymentStatus: "Completed", status: "Pending" });
        if (order && order.couponApplied && order.couponCode) {
            await User.findByIdAndUpdate(userId, {
                $push: { coupons: { couponName: order.couponCode, usedAt: new Date() } }
            });
        }
        await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

        return res.status(200).json({ success: true, message: "Payment verified", orderId: orderDetails.orderId });
    } catch (error) {
        console.error("Error verifying payment:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId).populate('userId');
        const rzpOrder = await createRazorpayOrder(order.finalAmount);
        res.status(200).json({
            success: true,
            data: {
                order_id: rzpOrder.id,
                key_id: process.env.RAZORPAY_KEY_ID,
                amount: order.finalAmount * 100,
                currency: "INR",
                prefill: { name: order.userId.name, email: order.userId.email }
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const orderConfirm = async (req, res) => {
    try {
        const userId = req.session.user?._id || req.session.user || req.session.guestUserId;
        const user = await User.findById(userId);
        return res.render("orderConfirmation", { user, orderId: req.query.id });
    } catch (error) {
        return res.redirect("/pageNotFound");
    }
};

const applyCoupon = async (req, res) => {
    try {
        const { couponCode, totalAmount } = req.body;
        const userId = req.session.user?._id || req.session.user || req.session.guestUserId;

        if (!userId) return res.status(401).json({ success: false, message: "User not logged in" });

        const user = await User.findById(userId);
        if (user && user.coupons && user.coupons.some(c => c.couponName === couponCode)) {
            return res.status(400).json({ success: false, message: "You have already used this coupon" });
        }

        const findCoupon = await Coupon.findOne({ name: couponCode, isList: true });
        if (!findCoupon) return res.status(400).json({ success: false, message: "Invalid coupon" });

        const today = new Date();
        if (today < new Date(findCoupon.createdOn) || today > new Date(findCoupon.expireOn)) {
            return res.status(400).json({ success: false, message: "Coupon is not active or expired" });
        }

        const parsedTotalAmount = parseFloat(totalAmount);
        if (parsedTotalAmount < findCoupon.minimumPrice) {
            return res.status(400).json({ success: false, message: `Min purchase ₹${findCoupon.minimumPrice} required` });
        }

        let discountAmount = 0;
        if (findCoupon.couponType === 'percentage') {
            discountAmount = (findCoupon.offerPrice / 100) * parsedTotalAmount;
        } else {
            discountAmount = findCoupon.offerPrice;
        }

        const finalPrice = Math.max(0, parsedTotalAmount - discountAmount);
        return res.status(200).json({
            success: true,
            totalAmount: finalPrice.toFixed(2),
            discount: discountAmount.toFixed(2),
            originalAmount: parsedTotalAmount.toFixed(2)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getcheckoutPage,
    postCheckout,
    orderConfirm,
    verifyPayment,
    applyCoupon,
    retryPayment
};