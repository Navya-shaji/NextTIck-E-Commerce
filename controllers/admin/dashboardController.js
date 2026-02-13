const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Brand = require('../../models/brandSchema');

const loadDashboard = async (req, res) => {
    try {
        // Summary Stats
        const [
            activeRevenueResult,
            totalRevenueResult,
            pendingOrdersCount,
            completedOrdersCount,
            totalOrdersCount,
            totalUsersCount,
            totalProductsCount
        ] = await Promise.all([
            Order.aggregate([
                { $match: { status: { $nin: ['Cancelled', 'Returned'] } } },
                { $group: { _id: null, total: { $sum: '$finalAmount' } } }
            ]),
            Order.aggregate([
                { $group: { _id: null, total: { $sum: '$finalAmount' } } }
            ]),
            Order.countDocuments({ status: 'Pending' }),
            Order.countDocuments({ status: 'Delivered' }),
            Order.countDocuments({}),
            User.countDocuments({ isAdmin: false }),
            Product.countDocuments({ isBlocked: false })
        ]);

        const activeRevenue = activeRevenueResult[0]?.total || 0;
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // Top Performers
        const [topProducts, topCategories, topBrands] = await Promise.all([
            getTopProducts(),
            getTopCategories(),
            getTopBrands()
        ]);

        // Monthly Data (Current Year)
        const currentYear = new Date().getFullYear();
        const monthlyData = await Order.aggregate([
            {
                $match: {
                    status: { $nin: ['Cancelled', 'Returned'] },
                    createdOn: {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(currentYear + 1, 0, 1)
                    }
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

        const months = Array(12).fill(0);
        monthlyData.forEach(item => {
            months[item._id - 1] = item.total;
        });

        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        res.render('dashboard', {
            admin: req.session.admin,
            totalUsers: totalUsersCount,
            totalProducts: totalProductsCount,
            totalOrders: totalOrdersCount,
            activeRevenue,
            totalRevenue,
            pendingOrders: pendingOrdersCount,
            completedOrders: completedOrdersCount,
            topProducts,
            topCategories,
            topBrands,
            initialSalesData: {
                labels,
                data: months
            }
        });

    } catch (error) {
        console.error('Error in loadDashboard:', error);
        res.status(500).render('admin/admin-error', { message: 'Error loading dashboard' });
    }
};

// Helper function to get top products
async function getTopProducts() {
    try {
        const result = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
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
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);
        return result;
    } catch (error) {
        console.error('Error in getTopProducts:', error);
        return [];
    }
}

async function getTopCategories() {
    try {
        const result = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
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
                $lookup: {
                    from: 'categories',
                    localField: 'productInfo.category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            {
                $group: {
                    _id: '$productInfo.category',
                    name: { $first: '$categoryInfo.name' },
                    count: { $sum: '$orderItems.quantity' },
                    revenue: {
                        $sum: { $multiply: [{ $toDouble: '$orderItems.price' }, '$orderItems.quantity'] }
                    }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);
        return result;
    } catch (error) {
        console.error('Error in getTopCategories:', error);
        return [];
    }
}

async function getTopBrands() {
    try {
        const result = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
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
                $lookup: {
                    from: 'brands',
                    localField: 'productInfo.brand',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            { $unwind: '$brandInfo' },
            {
                $group: {
                    _id: '$productInfo.brand',
                    name: { $first: '$brandInfo.brandName' },
                    count: { $sum: '$orderItems.quantity' },
                    revenue: {
                        $sum: { $multiply: [{ $toDouble: '$orderItems.price' }, '$orderItems.quantity'] }
                    },
                    totalOrderCount: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);
        return result;
    } catch (error) {
        console.error('Error in getTopBrands:', error);
        return [];
    }
}

// Get sales data based on filter
const getSalesData = async (req, res) => {
    try {
        const { filter, year } = req.query;
        const startYear = parseInt(year);
        let labels = [];
        let data = [];

        // Get order statistics
        const [
            totalOrdersCount,
            activeRevenueResult,
            totalRevenueResult,
            pendingOrdersCount,
            completedOrdersCount
        ] = await Promise.all([
            Order.countDocuments(),
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

        switch (filter) {
            case 'yearly':
                // Get last 5 years data
                for (let i = 4; i >= 0; i--) {
                    const yearData = await Order.aggregate([
                        {
                            $match: {
                                createdOn: {
                                    $gte: new Date(startYear - i, 0, 1),
                                    $lt: new Date(startYear - i + 1, 0, 1)
                                },
                                status: { $nin: ['Cancelled', 'Returned'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: '$finalAmount' }
                            }
                        }
                    ]);

                    labels.push(startYear - i);
                    data.push(yearData[0]?.total || 0);
                }
                break;

            case 'monthly':
                // Get monthly data for selected year
                const monthlyData = await Order.aggregate([
                    {
                        $match: {
                            createdOn: {
                                $gte: new Date(startYear, 0, 1),
                                $lt: new Date(startYear + 1, 0, 1)
                            },
                            status: { $nin: ['Cancelled', 'Returned'] }
                        }
                    },
                    {
                        $group: {
                            _id: { $month: '$createdOn' },
                            total: { $sum: '$finalAmount' }
                        }
                    },
                    { $sort: { '_id': 1 } }
                ]);

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                labels = months;
                data = Array(12).fill(0);
                monthlyData.forEach(item => {
                    data[item._id - 1] = item.total;
                });
                break;

            case 'weekly':
                // Get weekly data for current month
                const weeksInMonth = getWeeksInMonth(startYear, new Date().getMonth());
                for (let week = 0; week < weeksInMonth; week++) {
                    labels.push(`Week ${week + 1}`);
                    const weekData = await Order.aggregate([
                        {
                            $match: {
                                createdOn: {
                                    $gte: new Date(startYear, new Date().getMonth(), week * 7 + 1),
                                    $lt: new Date(startYear, new Date().getMonth(), (week + 1) * 7 + 1)
                                },
                                status: { $nin: ['Cancelled', 'Returned'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: '$finalAmount' }
                            }
                        }
                    ]);
                    data.push(weekData[0]?.total || 0);
                }
                break;

            case 'daily':
                // Get daily data for current month
                const daysInMonth = new Date(startYear, new Date().getMonth() + 1, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    labels.push(day.toString());
                    const dayData = await Order.aggregate([
                        {
                            $match: {
                                createdOn: {
                                    $gte: new Date(startYear, new Date().getMonth(), day),
                                    $lt: new Date(startYear, new Date().getMonth(), day + 1)
                                },
                                status: { $nin: ['Cancelled', 'Returned'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: '$finalAmount' }
                            }
                        }
                    ]);
                    data.push(dayData[0]?.total || 0);
                }
                break;
        }

        res.json({
            labels,
            data,
            totalOrders: totalOrdersCount,
            activeRevenue,
            totalRevenue,
            pendingOrders: pendingOrdersCount,
            completedOrders: completedOrdersCount
        });

    } catch (error) {
        console.error('Error in getSalesData:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Helper function to get number of weeks in a month
function getWeeksInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return Math.ceil((lastDay.getDate() - firstDay.getDate() + 1) / 7);
}

module.exports = {
    loadDashboard,
    getSalesData,
    getTopProducts,
    getTopCategories,
    getTopBrands
};