const Cart = require("../models/cartSchema");
const Order = require("../models/orderSchema");
const User = require("../models/userSchema");
const Wishlist = require("../models/wishlistSchema");

/**
 * Migrates cart and order data from a guest user to a registered user.
 * @param {string} guestUserId - The ID of the guest user.
 * @param {string} registeredUserId - The ID of the registered user.
 */
const migrateGuestData = async (guestUserId, registeredUserId) => {
    try {
        if (!guestUserId || !registeredUserId || guestUserId.toString() === registeredUserId.toString()) {
            return;
        }

        // 1. Migrate Cart
        const guestCart = await Cart.findOne({ userId: guestUserId });
        if (guestCart) {
            const userCart = await Cart.findOne({ userId: registeredUserId });
            if (userCart) {
                // Merge carts
                for (const item of guestCart.items) {
                    const existingItemIndex = userCart.items.findIndex(
                        (i) => i.productId.toString() === item.productId.toString()
                    );
                    if (existingItemIndex > -1) {
                        userCart.items[existingItemIndex].quantity += item.quantity;
                        userCart.items[existingItemIndex].totalPrice += item.totalPrice;
                    } else {
                        userCart.items.push(item);
                    }
                }
                await userCart.save();
                await Cart.deleteOne({ userId: guestUserId });
            } else {
                // Transfer cart
                guestCart.userId = registeredUserId;
                await guestCart.save();
            }
        }

        // 2. Migrate Orders
        await Order.updateMany({ userId: guestUserId }, { userId: registeredUserId });

        // 3. Migrate Wishlist
        const guestWishlist = await Wishlist.findOne({ userId: guestUserId });
        if (guestWishlist) {
            const userWishlist = await Wishlist.findOne({ userId: registeredUserId });
            if (userWishlist) {
                // Merge wishlists
                for (const item of guestWishlist.products) {
                    const exists = userWishlist.products.some(
                        (p) => p.productId.toString() === item.productId.toString()
                    );
                    if (!exists) {
                        userWishlist.products.push(item);
                    }
                }
                await userWishlist.save();
                await Wishlist.deleteOne({ userId: guestUserId });
            } else {
                // Transfer wishlist
                guestWishlist.userId = registeredUserId;
                await guestWishlist.save();
            }
        }

        // 3. Delete Guest User
        await User.deleteOne({ _id: guestUserId, isGuest: true });

        console.log(`Successfully migrated data from guest ${guestUserId} to user ${registeredUserId}`);
    } catch (error) {
        console.error("Error during guest data migration:", error);
    }
};

module.exports = { migrateGuestData };
