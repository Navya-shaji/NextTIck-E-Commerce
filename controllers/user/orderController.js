const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require('../../models/orderSchema');
const Wallet = require("../../models/walletSchema");
const Review = require("../../models/reviewSchema");
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit-table');

//for getting the order history page..........................................

const getOrderHistory = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        if (!user) {
            return res.redirect("/login");
        }
        const userId = user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments({ userId });
        const totalPages = Math.ceil(totalOrders / limit);
        const orders = await Order.find({ userId })
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.render('profile', {
            user: user,
            orders: orders,
            activeTab: 'v-pills-orders-tab',
            userAddress: {},
            wallet: { transactions: [], totalBalance: 0 },
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                currentAddressPage: 1,
                totalAddressPages: 1,
                currentWalletPage: 1,
                totalWalletPages: 1
            }
        });
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
};


// for geting the order details page...................................................

const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.session.user?._id || req.user?._id;

        const order = await Order.findOne({ _id: orderId, userId })
            .populate('orderItems.product')
            .populate('address');

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        res.render('orderDetails', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
};


//for cancelling orders.......................................
const cancelOrder = async (req, res) => {
    try {
        const { orderId, cancellationReason } = req.body;

        if (!orderId || !cancellationReason) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and cancellation reason are required'
            });
        }

        // Find the order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending orders can be cancelled'
            });
        }

        // Update order status and reason
        order.status = 'Cancelled';
        order.cancellationReason = cancellationReason;

        // Save the order
        await order.save();

        // Restore product stock for each item in the order
        if (order.orderItems && Array.isArray(order.orderItems)) {
            for (const item of order.orderItems) {
                try {
                    const product = await Product.findById(item.product);
                    if (product) {
                        product.quantity += item.quantity;
                        await product.save();
                    }
                } catch (stockError) {
                    console.error('Error updating product stock:', stockError);
                }
            }
        }

        // Handle refund if payment was completed
        if (order.paymentStatus === 'Completed') {
            try {
                const wallet = await addRefundToWallet(order.userId, order.finalAmount, orderId);
                order.paymentStatus = 'Refunded';
                await order.save();

                return res.status(200).json({
                    success: true,
                    message: 'Order cancelled successfully and amount refunded to wallet',
                    wallet: {
                        totalBalance: wallet.totalBalance,
                        transactions: wallet.transactions
                    }
                });
            } catch (refundError) {
                console.error('Error processing refund:', refundError);
                return res.status(200).json({
                    success: true,
                    message: 'Order cancelled successfully but refund failed. Our team will process it manually.'
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel order. Please try again.'
        });
    }
};//Refund adding...................................
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


//order status...............................................

const getOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, status: order.status });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch order status' });
    }
};



//viewing the orderDetails..................................................

const viewOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.session.user?._id || req.user?._id;

        const order = await Order.findOne({ _id: orderId, userId })
            .populate('orderItems.product');

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        // Fetch which products in this order the user has already reviewed
        const userIdForReview = req.session.user?._id || req.user?._id;
        const productIds = order.orderItems
            .filter(item => item.product)
            .map(item => item.product._id);

        const existingReviews = await Review.find({
            userId,
            productId: { $in: productIds }
        }).select('productId');

        // Build a Set of productId strings for O(1) lookup in the template
        const reviewedProductIds = new Set(
            existingReviews.map(r => r.productId.toString())
        );

        res.render('order-details-full', { order, reviewedProductIds });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Server error');
    }
};


//changing order status............................

const changeOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { newStatus } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }


        const allowedStatusChanges = {
            'Pending': ['Processing', 'Cancelled'],
            'Processing': ['Shipped', 'Cancelled'],
            'Shipped': ['Delivered', 'Returned'],
            'Delivered': ['Returned'],

        };

        if (!allowedStatusChanges[order.status] || !allowedStatusChanges[order.status].includes(newStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid status change' });
        }

        order.status = newStatus;
        await order.save();

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error changing order status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


//showing the return reason page...............................................

const showReturnReasonPage = async (req, res) => {
    const orderId = req.params.orderId
    try {
        const order = await Order.findOne({ orderId });

        res.render('return-reason', { orderId });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send('Internal Server Error');
    }
};


// Submit the return reason..............................
const submitReturnReason = async (req, res) => {
    const { orderId, reason } = req.body;

    if (!orderId || !reason) {
        return res.status(400).json({
            success: false,
            message: 'Order ID and return reason are required'
        });
    }

    try {

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const allowedStatuses = ['Delivered'];
        if (!allowedStatuses.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'This order is not eligible for return'
            });
        }

        order.returnReason = reason;
        order.status = 'Return Request';

        await order.save();

        res.json({
            success: true,
            message: 'Return request successfully submitted!'
        });

    } catch (error) {
        console.error('Error submitting return reason:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process return request'
        });
    }
};


//updating order status..................................................


const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({
                success: false,
                message: "Order ID and status are required."
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        order.status = status;
        await order.save();

        res.json({
            success: true,
            message: "Order status updated successfully."
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


//returning...................................
const processReturn = async (req, res) => {
    const { orderId, userId } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(orderId).session(session);

        if (!order || order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Invalid return request' });
        }

        if (order.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized return request' });
        }

        const returnDeadline = new Date(order.deliveryDate);
        returnDeadline.setDate(returnDeadline.getDate() + 30); // 30-day return policy
        if (new Date() > returnDeadline) {
            return res.status(400).json({ success: false, message: 'Return period has expired' });
        }

        if (order.status === 'Returned') {
            return res.status(400).json({ success: false, message: 'Order has already been returned' });
        }

        order.status = 'Returned';
        await order.save({ session });

        const refundAmount = order.finalAmount;
        const user = await User.findById(userId).session(session);
        user.walletBalance += refundAmount;
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Order returned successfully and wallet updated.',
            data: { walletBalance: user.walletBalance }
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error processing return:', { orderId, userId, error });
        res.status(500).json({ success: false, message: 'Failed to process return' });
    }
};

// New controller methods for handling product-specific order actions

const getOrderProducts = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
            .populate('products.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Format products for frontend
        const products = order.products.map(item => ({
            _id: item.product._id,
            name: item.product.name,
            price: item.price,
            quantity: item.quantity,
            image: item.product.images[0] // Assuming first image is main image
        }));

        res.json({
            success: true,
            products
        });
    } catch (error) {
        console.error('Error fetching order products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order products'
        });
    }
};

const cancelOrderProducts = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { products } = req.body; // Array of { productId, reason }

        if (!products || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No products selected for cancellation'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        let refundAmount = 0;

        for (const { productId, reason } of products) {
            const item = order.orderItems.find(i => i.product.toString() === productId);
            const cancellableOrderStatuses = ['Pending', 'Processing'];

            if (item && item.status !== 'Cancelled' && (item.status === 'Pending' || cancellableOrderStatuses.includes(order.status))) {
                item.status = 'Cancelled';
                item.cancellationReason = reason;
                refundAmount += item.price * item.quantity;

                // Restore stock
                try {
                    const product = await Product.findById(productId);
                    if (product) {
                        product.quantity += item.quantity;
                        await product.save();
                    }
                } catch (stockError) {
                    console.error('Error restoring stock for item:', productId, stockError);
                }
            }
        }

        // Update overall status if all items are cancelled
        const allCancelled = order.orderItems.every(i => i.status === 'Cancelled');
        if (allCancelled) {
            order.status = 'Cancelled';
        }

        await order.save();

        if (refundAmount > 0 && order.paymentStatus === 'Completed') {
            await addRefundToWallet(order.userId, refundAmount, orderId);
        }

        res.json({
            success: true,
            message: 'Selected products cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel products'
        });
    }
};

const returnOrderProducts = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { products } = req.body;

        if (!products || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No products selected for return'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        products.forEach(({ productId, reason }) => {
            const item = order.orderItems.find(i => i.product.toString() === productId);
            // Allow return if order is delivered OR item is explicitly marked as delivered
            // AND it's not already returned/requested
            if (item && (item.status === 'Delivered' || order.status === 'Delivered') && item.status !== 'Return Request' && item.status !== 'Returned') {
                item.status = 'Return Request';
                item.returnReason = reason;
            }
        });

        const allReturned = order.orderItems.every(i => i.status === 'Return Request' || i.status === 'Returned' || i.status === 'Cancelled');
        if (allReturned) {
            order.status = 'Return Request';
        }

        await order.save();

        res.json({
            success: true,
            message: 'Return request submitted for selected products'
        });
    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process return request'
        });
    }
};

const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate('userId')
            .populate('orderItems.product')
            .populate('address');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('NEXTICK', { align: 'center' });
        doc.fontSize(10).text('Premium Timepieces', { align: 'center' });
        doc.moveDown();
        doc.fontSize(15).text('INVOICE', { align: 'right' });
        doc.moveDown();

        // Order Info
        doc.fontSize(10).text(`Order ID: ${order.orderId}`);
        doc.text(`Date: ${new Date(order.createdOn).toLocaleDateString()}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Status: ${order.status}`);
        doc.moveDown();

        // Customer Info
        doc.fontSize(12).text('Shipping Address:', { underline: true });
        doc.fontSize(10).text(order.shippingAddress || 'N/A');
        doc.moveDown();

        // Items Table
        const table = {
            title: "Order Details",
            headers: ["Product", "Quantity", "Unit Price", "Total"],
            rows: []
        };

        order.orderItems.forEach(item => {
            table.rows.push([
                item.product ? item.product.productName : "Unknown Product",
                item.quantity.toString(),
                `INR ${item.price.toFixed(2)}`,
                `INR ${(item.price * item.quantity).toFixed(2)}`
            ]);
        });

        await doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("Helvetica").fontSize(10);
            },
        });

        doc.moveDown();

        // Summary
        doc.text(`Subtotal: INR ${order.totalPrice.toFixed(2)}`, { align: 'right' });
        if (order.discount > 0) {
            doc.text(`Discount: - INR ${order.discount.toFixed(2)}`, { align: 'right' });
        }
        if (order.deliveryCharge > 0) {
            doc.text(`Shipping: INR ${order.deliveryCharge.toFixed(2)}`, { align: 'right' });
        }
        doc.fontSize(12).font("Helvetica-Bold").text(`Total Amount: INR ${order.finalAmount.toFixed(2)}`, { align: 'right' });

        doc.moveDown(2);
        doc.fontSize(10).font("Helvetica").text('Thank you for shopping with NextTick!', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    getOrderHistory,
    cancelOrder,
    getOrderStatus,
    getOrderDetails,
    viewOrderDetails,
    changeOrderStatus,
    updateOrderStatus,
    showReturnReasonPage,
    submitReturnReason,
    processReturn,
    getOrderProducts,
    cancelOrderProducts,
    returnOrderProducts,
    downloadInvoice
};