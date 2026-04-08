
const mongoose = require("mongoose")
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        // required: true
    },
    orderId: {
        type: String,
        default: () => "NT-" + Math.floor(100000 + Math.random() * 900000),
        unique: true
    },
    orderNumber: {
        type: Number,
        unique: true
    },
    orderItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            default: "Pending",
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"]
        },
        cancellationReason: {
            type: String,
            default: null
        },
        returnReason: {
            type: String,
            default: null
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
        type: Schema.Types.ObjectId,
        ref: "Address",
        required: false
    },
    guestEmail: {
        type: String,
        required: false
    },
    guestPhone: {
        type: String,
        required: false
    },
    shippingAddress: {
        type: String,
        required: false
    },
    paymentMethod: {
        type: String,
        required: false
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    invoiceDate: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"]

    },
    returnedByUser: { type: Boolean, default: false },

    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied: {
        type: Boolean,
        default: false,
    },
    couponCode: {
        type: String,
        default: null
    },
    paymentId: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded']
    },
    returnReason: {
        type: String,
        required: false
    },
    cancellationReason: {
        type: String,
        default: null
    },
});

orderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderNumber) {
        try {
            const OrderModel = mongoose.model('Order');
            const lastOrder = await OrderModel.findOne({}, 'orderNumber').sort({ orderNumber: -1 });
            this.orderNumber = lastOrder && lastOrder.orderNumber ? lastOrder.orderNumber + 1 : 100001;
        } catch (error) {
            console.error("Error generating orderNumber:", error);
            // Fallback for uniqueness
            this.orderNumber = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
        }
    }

    if (this.totalPrice) this.totalPrice = Math.round(this.totalPrice * 100) / 100;
    if (this.discount) this.discount = Math.round(this.discount * 100) / 100;
    if (this.finalAmount) this.finalAmount = Math.round(this.finalAmount * 100) / 100;
    if (this.deliveryCharge) this.deliveryCharge = Math.round(this.deliveryCharge * 100) / 100;
    
    // Ensure orderItems prices are also rounded
    if (this.orderItems && this.orderItems.length > 0) {
        this.orderItems.forEach(item => {
            if (item.price) item.price = Math.round(item.price * 100) / 100;
        });
    }

    next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
