const mongoose = require("mongoose");
const { Schema } = mongoose; 

const userSchema = new Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { email: { $type: "string" } }
    },
  },
  phone: {
    type: String,
    required: false,
    unique: false,
    sparse: true,
    default: null,
  },
  isGuest: {
    type: Boolean,
    default: false,
  },
  guestId: {
    type: String,
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { guestId: { $type: "string" } }
    }
  },
  expiresAt: {
    type: Date,
    default: null,
    index: { expires: 0 }, // TTL index
  },
  googleId: {
    type: String,
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { googleId: { $type: "string" } }
    },
  },
  password: {
    type: String,
    required: false,
  },
  profileImage: {
    type: String,
    default: null
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  cart: [
    {
      type: Schema.Types.ObjectId, // Fixed schema to Schema
      ref: "Cart",
    },
  ],
  wallet: [
    {
      type: Schema.Types.ObjectId, // Fixed typo (schema -> Schema)
      ref: "Wallet",
    },
  ],
  orderHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  createdOn: {
    type: Date,
    default: Date.now,
  },
  referalCode: {
    type: String,
    // required: true,
  },
  redeemed: {
    type: Boolean,
    // default: false,
  },
  redeemedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
  ],
  searchHistory: [
    {
      category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
      brand: {
        type: String, // Fixed typo (type -> type)
      },
      searchOn: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  coupons: [
    {
      couponName: {
        type: String,
      }
    }
  ]
});

const User = mongoose.model("User", userSchema);
module.exports = User;
