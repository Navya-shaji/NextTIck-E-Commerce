const mongoose = require("mongoose")
const { schema } = mongoose;

const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
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
        required: true
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
    userId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]

})

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon