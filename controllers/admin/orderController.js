const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require('../../models/orderSchema');
const Wallet = require('../../models/walletSchema');
const mongoose = require('mongoose');


//listing orders......................................................................................................
const listOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        // Get total orders count
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        // Calculate order statistics
        const [
            activeRevenueResult,
            totalRevenueResult,
            pendingOrdersCount,
            completedOrdersCount
        ] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        status: { $nin: ['Cancelled', 'Returned'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$finalAmount' }
                    }
                }
            ]),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$finalAmount' }
                    }
                }
            ]),
            Order.countDocuments({ status: 'Pending' }),
            Order.countDocuments({ status: 'Delivered' })
        ]);

        const activeRevenue = activeRevenueResult[0]?.total || 0;
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        const orders = await Order.find({})
            .populate('userId', 'name email')
            .populate('orderItems.product')
            .populate('address')
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const processedOrders = orders.map(order => ({
            ...order,
            userName: order.userId ? order.userId.name : 'Unknown User',
            couponDetails: order.couponApplied ? `Coupon: ${order.couponCode} applied.` : 'No coupon applied.',
            offerDetails: order.offerApplied ? order.offerDetails : 'No offer applied.'
        }));

        if (req.headers.accept === 'application/json') {
            return res.json({
                orders: processedOrders,
                currentPage: page,
                totalPages,
                totalOrders,
                activeRevenue,
                totalRevenue,
                pendingOrders: pendingOrdersCount,
                completedOrders: completedOrdersCount
            });
        }

        res.render('orders', {
            orders: processedOrders,
            currentPage: page,
            totalPages,
            totalOrders,
            activeRevenue,
            totalRevenue,
            pendingOrders: pendingOrdersCount,
            completedOrders: completedOrdersCount,
            title: 'Order Management'
        });

    } catch (error) {
        console.error('Error in listOrders:', error);
        res.status(500).send('Internal Server Error');
    }
};

//Refund adding...................................
const addRefundToWallet = async (userId, amount, orderId) => {
    try {
        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            // Initialize new wallet with the refund amount as the initial balance
            wallet = new Wallet({
                userId,
                totalBalance: amount,
                transactions: []
            });
        } else {
            // If wallet exists, ensure transactions array exists
            if (!Array.isArray(wallet.transactions)) {
                wallet.transactions = [];
            }
            // Add refund amount to existing balance
            wallet.totalBalance += amount;
        }

        // Add the transaction record
        wallet.transactions.push({
            type: 'Refund',
            amount: amount,
            orderId: orderId,
            status: 'Completed',
            description: `Refund for order ${orderId}`
        });

        await wallet.save();
        return wallet;
    } catch (error) {
        console.error('Error processing refund:', error);
        throw error;
    }
};



const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status === 'Delivered' && order.returnedByUser) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change status for an order that is delivered and cancelled by the user'
            });
        }

        const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }


        // Update product quantities
        const orderItems = order.orderItems;
        if (Array.isArray(orderItems)) {
            for (const item of orderItems) {
                try {
                    const product = await Product.findById(item.product);
                    if (product) {
                        const oldQuantity = product.quantity;
                        product.quantity = oldQuantity + item.quantity;
                        await product.save();
                    }
                } catch (error) {
                    console.error('Error updating product quantity:', error);
                }
            }
        }

        if (status === "Returned") {
            if (order.paymentStatus === 'Completed') {
                const userId = order.userId;
                const amount = order.finalAmount;

                try {
                    await addRefundToWallet(userId, amount, orderId);
                } catch (refundError) {
                    console.error('Error processing refund:', refundError);
                    return res.status(500).json({
                        success: false,
                        message: 'Order status updated to Returned but refund failed'
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Refund not applicable for unpaid or incomplete orders'
                });
            }
        }

        order.status = status;
        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully'
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
};


//for getting cancelled orders...............................................................

const getCancelledOrders = async (req, res) => {
    try {
        const cancelledOrders = await Order.find({ status: 'Cancelled' })
            .populate('userId', 'name email')
            .populate('orderItems.product')
            .populate('address')
            .sort({ createdOn: -1 })
            .lean();

        res.render('cancelled-orders', {
            orders: cancelledOrders,
            title: 'Cancelled Orders'
        });
    } catch (error) {
        console.error('Error fetching cancelled orders:', error);
        res.status(500).render('admin/error', { message: 'Failed to fetch cancelled orders' });
    }
};

//getting order details...........................................................................................................
const getAdminOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('userId', 'name email')
            .populate('orderItems.product', 'name price productImage') // Add productImage to population
            .populate('address', 'street city postalCode')
            .lean();

        if (!order) {
            return res.status(404).render('admin/error', { message: 'Order not found' });
        }

        // Process order items to ensure productImage exists
        order.orderItems = order.orderItems.map(item => ({
            ...item,
            product: {
                ...item.product,
                productImage: item.product?.productImage || ['default-product-image.jpg'] // Provide a default image
            }
        }));

        res.render('orderData', {
            order,
            title: 'Order Details',
            offerApplied: order.offerApplied || 'No Offer',
            couponDetails: order.couponApplied
                ? `${order.couponApplied.code} (Discount: ₹${order.couponApplied.discount})`
                : 'No Coupon',
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('admin/error', { message: 'Failed to fetch order details' });
    }
};

const processReturn = async (req, res) => {
    const { orderId, returnReason } = req.body;

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }



        // Update product quantities
        const orderItems = order.orderItems;
        if (Array.isArray(orderItems)) {
            for (const item of orderItems) {
                try {
                    const product = await Product.findById(item.product);
                    if (product) {
                        const oldQuantity = product.quantity;
                        product.quantity = oldQuantity + item.quantity;
                        await product.save();
                    }
                } catch (error) {
                    console.error('Error updating product quantity:', error);
                }
            }
        }


        if (order.status !== 'Placed') {
            return res.status(400).json({
                success: false,
                message: 'Only placed orders can be returned'
            });
        }

        // Update order status
        order.status = 'Return Requested';
        order.returnReason = returnReason;
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Return request processed successfully and product quantities updated'
        });


    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process return: ' + error.message
        });
    }
};

const updateItemStatus = async (req, res) => {
    try {
        const { orderId, productId, status } = req.body;

        if (!orderId || !productId || !status) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const order = await Order.findById(orderId).populate('orderItems.product');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const item = order.orderItems.find(i => i.product._id.toString() === productId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Product not found in order' });
        }

        const oldStatus = item.status;
        item.status = status;

        // Handle stock restoration and refunds
        if (status === 'Cancelled' || status === 'Returned') {
            if (oldStatus !== 'Cancelled' && oldStatus !== 'Returned') {
                // Restore stock
                const product = await Product.findById(productId);
                if (product) {
                    product.quantity += item.quantity;
                    await product.save();
                }

                // Partial refund to wallet if paid
                if (order.paymentStatus === 'Completed') {
                    const refundAmount = item.price * item.quantity;
                    await addRefundToWallet(order.userId, refundAmount, orderId);
                }
            }
        }

        // Update overall order status if necessary
        const allItemsCancelled = order.orderItems.every(i => i.status === 'Cancelled');
        const allItemsReturned = order.orderItems.every(i => i.status === 'Returned' || i.status === 'Cancelled');

        if (allItemsCancelled) {
            order.status = 'Cancelled';
        } else if (allItemsReturned) {
            order.status = 'Returned';
        }

        await order.save();

        res.json({ success: true, message: `Item status updated to ${status}` });
    } catch (error) {
        console.error('Error in updateItemStatus:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const cancelOrderAdmin = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === 'Cancelled' || order.status === 'Delivered' || order.status === 'Returned') {
            return res.status(400).json({ success: false, message: `Cannot cancel order with status: ${order.status}` });
        }

        // Refund to wallet if paid
        if (order.paymentStatus === 'Completed' || order.paymentMethod === 'wallet' || order.paymentMethod === 'online') {
            await addRefundToWallet(order.userId, order.finalAmount, order._id);
            order.paymentStatus = 'Refunded';
        }

        // Restore Stock
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: item.quantity }
            });
            item.status = 'Cancelled';
        }

        order.status = 'Cancelled';
        order.cancellationReason = reason || "Cancelled by Admin";
        await order.save();

        res.json({ success: true, message: "Order cancelled and status updated" });

    } catch (error) {
        console.error("Error in cancelOrderAdmin:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const deleteOrderAdmin = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findByIdAndDelete(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, message: "Order permanently deleted" });

    } catch (error) {
        console.error("Error in deleteOrderAdmin:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = {
    getAdminOrderDetails,
    getCancelledOrders,
    updateOrderStatus,
    listOrders,
    processReturn,
    updateItemStatus,
    cancelOrderAdmin,
    deleteOrderAdmin
};