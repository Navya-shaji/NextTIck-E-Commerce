// Admin Route Constants
const ADMIN_ROUTES = {
    // Auth & Dashboard
    ROOT: '/',
    LOGIN: '/login',
    LOGOUT: '/logout',
    DASHBOARD: '/dashboard',
    PAGE_ERROR: '/pageerror',

    // Dashboard Data
    SALES_DATA: '/dashboard/sales-data',
    TOP_PRODUCTS: '/dashboard/top-products',
    TOP_CATEGORIES: '/dashboard/top-categories',
    TOP_BRANDS: '/dashboard/top-brands',

    // Customer Management
    USERS: '/users',
    BLOCK_USER: '/block/:id',
    UNBLOCK_USER: '/unblock/:id',

    // Category Management
    CATEGORY: '/category',
    ADD_CATEGORY: '/addCategory',
    EDIT_CATEGORY: '/editCategory',
    EDIT_CATEGORY_BY_ID: '/editCategory/:id',
    LIST_CATEGORY: '/listCategory',
    UNLIST_CATEGORY: '/unlistCategory',
    ADD_CATEGORY_OFFER: '/addCategoryOffer',
    REMOVE_CATEGORY_OFFER: '/removeCategoryOffer',

    // Brand Management
    BRANDS: '/brands',
    ADD_BRAND: '/addBrand',
    BLOCK_BRAND: '/blockBrand/:id',
    UNBLOCK_BRAND: '/unblockBrand/:id',
    DELETE_BRAND: '/deleteBrand',

    // Product Management
    PRODUCTS: '/products',
    ADD_PRODUCTS: '/addProducts',
    EDIT_PRODUCT: '/editProduct',
    EDIT_PRODUCT_BY_ID: '/editProduct/:id',
    BLOCK_PRODUCT: '/blockProduct',
    UNBLOCK_PRODUCT: '/unblockProduct',
    DELETE_IMAGE: '/deleteImage',
    ADD_PRODUCT_IMAGE: '/addProductImage',
    ADD_PRODUCT_OFFER: '/addProductOffer',
    REMOVE_PRODUCT_OFFER: '/removeProductOffer',
    UPDATE_PRODUCT: '/product/edit/:id',

    // Order Management
    ORDER_LIST: '/orderList',
    ORDERS_CANCELLED: '/orders/cancelled',
    ORDER_DETAILS: '/orders/:orderId',
    UPDATE_ORDER_STATUS: '/orders/update-status',
    UPDATE_ITEM_STATUS: '/orders/update-item-status',
    CANCEL_ORDER: '/orders/cancel-order',
    DELETE_ORDER: '/orders/delete-order',

    // Coupon Management
    COUPON: '/coupon',
    CREATE_COUPON: '/createCoupon',
    EDIT_COUPON: '/editCoupon',
    UPDATE_COUPON: '/updateCoupon',
    DELETE_COUPON: '/deleteCoupon/:id',

    // Banner Management
    BANNERS: '/banners',
    ADD_BANNER: '/addBanner',
    TOGGLE_BANNER_STATUS: '/toggleBannerStatus/:id',
    EDIT_BANNER: '/editBanner/:id',
    DELETE_BANNER: '/deleteBanner/:id',

    // Sales Report
    SALES_REPORT: '/sales-report',
    GENERATE_SALES_REPORT: '/sales-report/generate',
    DOWNLOAD_SALES_REPORT: '/sales-report/download'
};

module.exports = ADMIN_ROUTES;
