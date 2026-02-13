// Success Messages
const SUCCESS_MESSAGES = {
    // Banner
    BANNER_ADDED: 'Banner added successfully',
    BANNER_UPDATED: 'Banner status updated',
    BANNER_DELETED: 'Banner deleted successfully',

    // Product
    PRODUCT_ADDED: 'Product added successfully',
    PRODUCT_UPDATED: 'Product updated successfully',
    PRODUCT_DELETED: 'Product deleted successfully',
    PRODUCT_BLOCKED: 'Product blocked successfully',
    PRODUCT_UNBLOCKED: 'Product unblocked successfully',

    // Category
    CATEGORY_ADDED: 'Category added successfully',
    CATEGORY_UPDATED: 'Category updated successfully',
    CATEGORY_DELETED: 'Category deleted successfully',

    // Brand
    BRAND_ADDED: 'Brand added successfully',
    BRAND_UPDATED: 'Brand updated successfully',
    BRAND_DELETED: 'Brand deleted successfully',

    // Order
    ORDER_UPDATED: 'Order status updated successfully',
    ORDER_CANCELLED: 'Order cancelled successfully',
    ORDER_DELETED: 'Order deleted successfully',

    // Coupon
    COUPON_CREATED: 'Coupon created successfully',
    COUPON_UPDATED: 'Coupon updated successfully',
    COUPON_DELETED: 'Coupon deleted successfully',

    // User
    USER_BLOCKED: 'User blocked successfully',
    USER_UNBLOCKED: 'User unblocked successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully',

    // Address
    ADDRESS_ADDED: 'Address added successfully',
    ADDRESS_UPDATED: 'Address updated successfully',
    ADDRESS_DELETED: 'Address deleted successfully',

    // Cart & Wishlist
    ADDED_TO_CART: 'Added to cart successfully',
    REMOVED_FROM_CART: 'Removed from cart successfully',
    ADDED_TO_WISHLIST: 'Added to wishlist successfully',
    REMOVED_FROM_WISHLIST: 'Removed from wishlist successfully',

    // Payment
    PAYMENT_SUCCESS: 'Payment completed successfully',
    REFUND_PROCESSED: 'Refund processed successfully'
};

// Error Messages
const ERROR_MESSAGES = {
    // General
    SERVER_ERROR: 'Server error occurred',
    INVALID_REQUEST: 'Invalid request',
    UNAUTHORIZED: 'Unauthorized access',
    NOT_FOUND: 'Resource not found',

    // Banner
    BANNER_NOT_FOUND: 'Banner not found',
    BANNER_IMAGE_REQUIRED: 'Banner image is required',
    BANNER_ADD_FAILED: 'Failed to add banner',
    BANNER_UPDATE_FAILED: 'Failed to update banner status',
    BANNER_DELETE_FAILED: 'Failed to delete banner',

    // Product
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_OUT_OF_STOCK: 'Product is out of stock',
    INSUFFICIENT_STOCK: 'Insufficient stock available',

    // User
    USER_NOT_FOUND: 'User not found',
    USER_BLOCKED: 'Your account has been blocked',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_EXISTS: 'Email already exists',

    // Order
    ORDER_NOT_FOUND: 'Order not found',
    ORDER_CANCEL_FAILED: 'Failed to cancel order',
    CANCELLATION_REASON_REQUIRED: 'Cancellation reason is required',

    // Coupon
    COUPON_NOT_FOUND: 'Coupon not found',
    COUPON_EXPIRED: 'Coupon has expired',
    COUPON_INVALID: 'Invalid coupon code',
    MINIMUM_PURCHASE_NOT_MET: 'Minimum purchase amount not met',

    // Address
    ADDRESS_NOT_FOUND: 'Address not found',

    // Payment
    PAYMENT_FAILED: 'Payment failed',
    PAYMENT_VERIFICATION_FAILED: 'Payment verification failed',

    // Validation
    REQUIRED_FIELDS_MISSING: 'Please fill all required fields',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PHONE: 'Invalid phone number',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    PASSWORDS_DONT_MATCH: 'Passwords do not match'
};

// Validation Messages
const VALIDATION_MESSAGES = {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    INVALID_URL: 'Please enter a valid URL',
    MIN_LENGTH: (min) => `Minimum ${min} characters required`,
    MAX_LENGTH: (max) => `Maximum ${max} characters allowed`,
    MIN_VALUE: (min) => `Minimum value is ${min}`,
    MAX_VALUE: (max) => `Maximum value is ${max}`,
    INVALID_DATE: 'Please enter a valid date',
    FUTURE_DATE: 'Date must be in the future',
    PAST_DATE: 'Date must be in the past'
};

module.exports = {
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    VALIDATION_MESSAGES
};
