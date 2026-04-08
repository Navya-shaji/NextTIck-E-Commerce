const mongoose =require("mongoose");
const {Schema}=mongoose;

const cartSchema =new mongoose.Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:false
    },
    sessionId:{
        type:String,
        required:false
    },
    items:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            required:true
        },
        status:{
            type:String,
            default:"placed"
        },
        cancellationReason:{
            type:String,
            default:"none"
        }

    }]
})

const Cart =mongoose.model("Cart",cartSchema);
module.exports =Cart;