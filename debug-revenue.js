const mongoose = require('mongoose');
const Order = require('./models/orderSchema');
const db = require('./config/db');

async function test() {
    await db();
    const activeRevenue = await Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Returned'] } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);
    const totalOrders = await Order.countDocuments({});
    const totalOrdersDetailed = await Order.find({}, { status: 1, finalAmount: 1 });

    console.log('ActiveRevenue Result:', JSON.stringify(activeRevenue, null, 2));
    console.log('Total Orders Count:', totalOrders);
    console.log('Orders Detail:', JSON.stringify(totalOrdersDetailed, null, 2));
    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
