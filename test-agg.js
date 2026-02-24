const mongoose = require('mongoose');
const Order = require('./models/orderSchema');
const Product = require('./models/productSchema');
const db = require('./config/db');

async function test() {
    await db();
    const result = await Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Returned'] } } },
        { $unwind: '$orderItems' },
        {
            $lookup: {
                from: 'products',
                localField: 'orderItems.product',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' },
        {
            $group: {
                _id: '$orderItems.product',
                name: { $first: '$productInfo.productName' },
                count: { $sum: '$orderItems.quantity' },
                revenue: {
                    $sum: { $multiply: [{ $toDouble: '$orderItems.price' }, '$orderItems.quantity'] }
                }
            }
        },
        { $sort: { revenue: -1 } }
    ]);
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
