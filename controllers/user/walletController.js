const Razorpay = require('razorpay');
const User = require('../../models/userSchema');
const Wallet = require("../../models/walletSchema");
const Order = require('../../models/orderSchema')

const razorpayInstance = new Razorpay({
  key_id: 'rzp_test_JfMI70tLzmblvw',
  key_secret: 'ZSv0SCOqj5d9UnOXfq4LqyyF',
});

// Create Razorpay order....................................................

const createRazorpayOrder = async (req, res) => {
  const { amount, userId } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    console.error('Invalid amount provided:', amount);
    return res.status(400).json({ success: false, message: 'Invalid amount provided' });
  }

  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId provided:', userId);
    return res.status(400).json({ success: false, message: 'Invalid userId provided' });
  }

  try {
    const receiptId = `wallet_${userId}_${Date.now()}`.slice(0, 40);

    const order = await razorpayInstance.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: receiptId,
    });

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    const errorMessage = error?.error?.description || 'Failed to create Razorpay order';
    res.status(500).json({ success: false, message: errorMessage });
  }
};



const updateWalletBalance = async (req, res) => {
  const { userId, paymentId, amount, razorpay_order_id, razorpay_signature } = req.body;

  if (!paymentId || !userId || !amount) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  try {
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid Razorpay signature' });
    }

    const paymentDetails = await razorpayInstance.payments.fetch(paymentId);
    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Payment not successful' });
    }

    const user = await User.findById(userId);
    user.walletBalance += amount;

    user.walletTransactions.push({
      date: new Date(),
      amount,
      status: 'Success',
      transactionId: paymentId,
    });

    await user.save();

    res.status(200).json({ success: true, message: 'Wallet balance updated successfully.' });
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    res.status(500).json({ success: false, message: 'Failed to update wallet balance' });
  }
};



const updateWalletAfterPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId, amount } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !userId || !amount) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid Razorpay signature' });
    }

    const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id);
    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Payment not successful' });
    }

    const user = await User.findById(userId);
    user.walletBalance += amount;

    user.walletTransactions.push({
      date: new Date(),
      amount,
      status: 'Success',
      transactionId: razorpay_payment_id,
    });

    await user.save();

    res.status(200).json({ success: true, message: 'Wallet balance updated successfully.' });
  } catch (error) {
    console.error('Error in payment callback:', error);
    res.status(500).json({ success: false, message: 'Failed to update wallet balance' });
  }
};



const handleReturnRefund = async (orderId, userId, refundAmount) => {
  try {
    const wallet = await Wallet.findOne({ userId: userId });

    if (!wallet) {
      const newWallet = new Wallet({
        userId: userId,
        totalBalance: refundAmount,
        transactions: [{
          type: 'Refund',
          amount: refundAmount,
          date: new Date(),
          description: `Refund for Order #${orderId}`,
          orderId: orderId,
          status: 'Completed'
        }]
      });
      await newWallet.save();
    } else {
      wallet.totalBalance += refundAmount;
      wallet.transactions.push({
        type: 'Refund',
        amount: refundAmount,
        date: new Date(),
        description: `Refund for Order #${orderId}`,
        orderId: orderId,
        status: 'Completed'
      });
      await wallet.save();
    }

    return true;
  } catch (error) {
    console.error('Error processing refund:', error);
    return false;
  }
};



const processReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { returnReason, comments, selectedProducts } = req.body;

    if (!selectedProducts || selectedProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one product to return'
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: `Cannot return order with status: ${order.status}. Order must be Delivered.`
      });
    }

    const userId = order.userId || req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate refund amount for selected products
    let refundAmount = 0;
    const returnedProducts = [];
    const remainingProducts = [];

    order.products.forEach(product => {
      const selectedProduct = selectedProducts.find(sp => sp.productId === product.productId.toString());
      if (selectedProduct) {
        refundAmount += product.price * selectedProduct.quantity;
        returnedProducts.push({
          ...product.toObject(),
          returnReason,
          returnDate: new Date(),
          returnComments: comments
        });
      } else {
        remainingProducts.push(product);
      }
    });

    // Update user's wallet balance
    const wallet = await Wallet.findOne({ userId: userId });
    if (wallet) {
      wallet.totalBalance += refundAmount;
      wallet.transactions.push({
        type: 'Refund',
        amount: refundAmount,
        description: `Refund for Order #${order.orderId} - Partial Return`,
        date: new Date(),
        orderId: order._id.toString(),
        status: 'Completed'
      });
      await wallet.save();
    } else {
      const newWallet = new Wallet({
        userId: userId,
        totalBalance: refundAmount,
        transactions: [{
          type: 'Refund',
          amount: refundAmount,
          description: `Refund for Order #${order.orderId} - Partial Return`,
          date: new Date(),
          orderId: order._id.toString(),
          status: 'Completed'
        }]
      });
      await newWallet.save();
    }

    // Update order status and details
    if (remainingProducts.length === 0) {
      // All products returned
      order.status = 'Returned';
      order.returnReason = returnReason;
      order.returnComments = comments;
      order.returnDate = new Date();
      order.paymentStatus = 'Refunded';
    } else {
      // Partial return
      order.status = 'Partially Returned';
      order.products = remainingProducts;
      order.returnedProducts = order.returnedProducts || [];
      order.returnedProducts.push(...returnedProducts);
      order.paymentStatus = 'Refunded';
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: remainingProducts.length === 0 ? 'Return processed successfully' : 'Partial return processed successfully',
      refundAmount,
      orderId: order.orderId
    });

  } catch (error) {
    console.error('Error in processReturn:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process return',
      error: error.message
    });
  }
};


const refundToWallet = async (req, res) => {
  const { amount, orderId } = req.body;
  const userId = req.session.user._id;
  try {

    let wallet = await Wallet.findOne({ userId: userId });

    if (!wallet) {
      wallet = new Wallet({
        userId: userId,
        totalBalance: 0,
        transactions: []
      });
    }

    wallet.totalBalance += amount;
    wallet.transactions.push({
      type: 'Refund',
      amount: amount,
      orderId: orderId,
      status: 'Completed',
      description: `Refund for order ${orderId}`,
    });

    await wallet.save();

    res.json({
      success: true, message: `₹${amount} has been added to your wallet.`, balance: wallet.totalBalance
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'An error occurred while processing the refund.' });
  }
};
module.exports = {
  createRazorpayOrder,
  updateWalletBalance,
  updateWalletAfterPayment,
  handleReturnRefund,
  processReturn,
  refundToWallet
};
