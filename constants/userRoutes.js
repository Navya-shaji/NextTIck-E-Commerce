// User Route Constants
const USER_ROUTES = {
    // Homepage & Auth
    HOME: '/',
    LOGOUT: '/logout',
    PAGE_NOT_FOUND: '/pageNotFound',
    SIGNUP: '/signup',
    LOGIN: '/login',
    VERIFY_OTP: '/verify-otp',
    RESEND_OTP: '/resend-otp',

    // Google Auth
    AUTH_GOOGLE: '/auth/google',
    AUTH_GOOGLE_CALLBACK: '/auth/google/callback',

    // Product
    PRODUCT_DETAILS: '/productDetails',

    // Profile
    USER_PROFILE: '/userProfile',
    PROFILE: '/profile',
    UPDATE_PROFILE: '/update-profile',
    UPDATE_PROFILE_RAW: '/updateProfile',
    UPDATE_PROFILE_IMAGE: '/update-profile-image',
    DELETE_PROFILE_IMAGE: '/delete-profile-image',

    // Password Management
    FORGOT_PASSWORD: '/forgot-password',
    FORGOT_EMAIL_VALID: '/forgot-email-valid',
    VERIFY_PASS_FORGOT_OTP: '/verify-passForgot-otp',
    RESET_PASSWORD: '/reset-password',
    RESEND_FORGOT_OTP: '/resend-forgot-otp',
    CHANGE_PASSWORD: '/change-password',
    CHANGE_PASSWORD_DIRECT: '/change-password-direct',
    VERIFY_CHANGE_PASSWORD_OTP: '/verify-changepassword-otp',

    // Email Management
    CHANGE_EMAIL: '/change-email',
    VERIFY_EMAIL_OTP: '/verify-email-otp',
    UPDATE_EMAIL: '/update-email',

    // Address Management
    ADD_ADDRESS: '/add-address',
    POST_ADD_ADDRESS: '/addaddress',
    USER_ADDRESS: '/userAddress',
    EDIT_ADDRESS: '/edit-address/:id',
    POST_EDIT_ADDRESS: '/postEditAddress/:id',
    DELETE_ADDRESS: '/delete-address/:id',

    // Wishlist
    WISHLIST: '/wishlist',
    ADD_TO_WISHLIST: '/addToWishlist',
    REMOVE_FROM_WISHLIST: '/wishlist/remove/:id',

    // Shop
    SHOP: '/shop',
    SEARCH: '/search',
    FILTER: '/filter',
    SORT: '/sort',

    // Cart
    ADD_TO_CART: '/addToCart',
    CART: '/cart',
    UPDATE_CART_QUANTITY: '/cart/update-quantity',
    REMOVE_FROM_CART: '/cart/remove',

    // Checkout
    CHECKOUT: '/checkout',
    ORDER_CONFIRMATION: '/orderConfirmation',
    VERIFY_PAYMENT: '/verify-payment',
    RETRY_PAYMENT: '/orders/retry-payment',

    // Orders
    ORDER_HISTORY: '/history',
    CANCEL_ORDER: '/orders/cancel',
    ORDER_STATUS: '/status/:orderId',
    ORDER_DETAILS: '/orders/:orderId',
    CHANGE_ORDER_STATUS: '/:orderId/status',
    VIEW_ORDER_DETAILS: '/orders/view/:id',
    UPDATE_ORDER_STATUS: '/orders/update-status',
    UPDATE_STATUS_RAW: '/update-status',
    RETURN_REASON: '/return-reason',
    RETURN_REASON_BY_ID: '/return-reason/:orderId',
    PROCESS_RETURN: '/process-return',
    PROCESS_RETURN_BY_ID: '/process-return/:orderId',
    ORDER_PRODUCTS: '/orders/:orderId/products',
    CANCEL_ORDER_PRODUCTS: '/orders/:orderId/cancel',
    RETURN_ORDER_PRODUCTS: '/orders/:orderId/return',
    DELETE_ORDER: '/orders/:orderId',

    // Wallet
    ADD_MONEY: '/add-money',
    UPDATE_BALANCE: '/update-balance',
    WALLET_REFUND: '/wallet/refund',
    UPDATE_WALLET_AFTER_PAYMENT: '/update-wallet-after-payment',

    // Coupon
    APPLY_COUPON: '/apply-coupon'
};

module.exports = USER_ROUTES;
