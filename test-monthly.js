const mongoose = require('mongoose');
const Order = require('./models/orderSchema');
const db = require('./config/db');

async function test() {
    await db();
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyData = await Order.aggregate([
        {
            $match: {
                status: { $nin: ['Cancelled', 'Returned'] },
                createdOn: { $gte: twelveMonthsAgo }
            }
        },
        {
            $group: {
                _id: { $month: '$createdOn' },
                total: { $sum: { $toDouble: '$finalAmount' } }
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    console.log('Range:', twelveMonthsAgo.toISOString(), 'to', now.toISOString());
    console.log('Monthly Data:', JSON.stringify(monthlyData, null, 2));
    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
