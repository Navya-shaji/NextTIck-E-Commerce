const mongoose = require("mongoose")
const { schema } = mongoose;

const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    expireOn: {
        type: Date,
        required: true
    },
    offerPrice: {
        type: Number,
        required: true
    },
    minimumPrice: {
        type: Number,
        required: true,
        default: 100 // Minimum purchase ≥ ₹100
    },
    maximumDiscount: {
        type: Number,
        required: false,
        default: null
    },
    couponType: {
        type: String,
        enum: ['percentage', 'flat'],
        default: 'flat',
        required: true
    },
    isList: {
        type: Boolean,
        default: true
    },
    globalUsageLimit: {
        type: Number,
        default: null // null for unlimited
    },
    usedCount: {
        type: Number,
        default: 0
    },
    usagePerUser: {
        type: Number,
        default: 1 // Default to 1 use per user
    },
    applyToCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    userId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    userUsageTracker: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 }
    }]
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon