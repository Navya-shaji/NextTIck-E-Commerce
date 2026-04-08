const mongoose = require("mongoose")

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
        default: 100
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
    }
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon