const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("../config/passport")
const productController = require("../controllers/user/productController")
const { userAuth, checkBlockedStatus, blockGuests } = require('../middlewares/auth');
const profileController = require("../controllers/user/profileController")
const cartController = require("../controllers/user/cartController");
const shopController = require("../controllers/user/shopController");
const checkoutController = require("../controllers/user/checkoutController");
const orderController = require("../controllers/user/orderController")
const wishlistController = require("../controllers/user/wishlistController");
const walletController = require("../controllers/user/walletController");
const ROUTES = require("../constants/userRoutes");



//homepage........................................................................................................
router.get(ROUTES.HOME, userController.loadHomepage);
router.get(ROUTES.LOGOUT, userController.logout)

router.get(ROUTES.PAGE_NOT_FOUND, userController.pageNotFound)
router.get(ROUTES.SIGNUP, userController.loadSignup)
router.post(ROUTES.SIGNUP, userController.signup)
router.post(ROUTES.VERIFY_OTP, userController.verifyOtp)
router.post(ROUTES.RESEND_OTP, userController.resendOtp)
router.get(ROUTES.ABOUT, shopController.loadAboutPage);
router.get(ROUTES.CONTACT, shopController.loadContactPage);


router.get(ROUTES.SHOP, shopController.loadshoppingPage);
router.get(ROUTES.SEARCH, shopController.searchProducts);
router.get(ROUTES.FILTER, shopController.loadshoppingPage);
router.get(ROUTES.SORT, shopController.loadshoppingPage);
// Google Auth Routes
router.get(ROUTES.AUTH_GOOGLE, (req, res, next) => {
    if (req.query.ref) {
        req.session.referralCode = req.query.ref;
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get(ROUTES.AUTH_GOOGLE_CALLBACK, passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    req.session.save((err) => {
        if (err) console.error("Google Auth Session Save Error:", err);
        res.redirect('/');
    });
});

// login page........................................................................................................
router.get(ROUTES.PAGE_NOT_FOUND, userController.pageNotFound)
router.get(ROUTES.LOGIN, userController.loadLogin)
router.post(ROUTES.LOGIN, userController.login)

//Product Management...............................................................................................
router.get(ROUTES.PRODUCT_DETAILS, productController.productDetail);


//profile Management...............................................................................................
router.get(ROUTES.FORGOT_PASSWORD, profileController.getForgotPassPage);
router.post(ROUTES.FORGOT_EMAIL_VALID, profileController.forgotEmailValid);
router.post(ROUTES.VERIFY_PASS_FORGOT_OTP, profileController.verifyForgotPassOtp)
router.post(ROUTES.UPDATE_PROFILE_IMAGE, userAuth, profileController.updateProfileImage);
router.post(ROUTES.DELETE_PROFILE_IMAGE, userAuth, profileController.deleteProfileImage);
router.get(ROUTES.RESET_PASSWORD, profileController.getResetPassPage);
router.post(ROUTES.RESEND_FORGOT_OTP, profileController.resendOtp);
router.post(ROUTES.RESET_PASSWORD, profileController.postNewPassword);
router.post(ROUTES.UPDATE_PROFILE, profileController.updateProfile);


router.use(userAuth);
router.use(checkBlockedStatus);
router.get(ROUTES.USER_PROFILE, profileController.userProfile);
router.post(ROUTES.UPDATE_PROFILE_RAW, profileController.updateProfile);
router.get(ROUTES.CHANGE_EMAIL, profileController.changeEmail);
router.post(ROUTES.CHANGE_EMAIL, profileController.changeEmailValid);
router.post(ROUTES.VERIFY_EMAIL_OTP, profileController.verifyEmailOtp);
router.post(ROUTES.UPDATE_EMAIL, profileController.updateEmail)
router.get(ROUTES.PROFILE, profileController.userProfile);
router.delete(ROUTES.DELETE_ORDER, profileController.deleteOrder);


router.get(ROUTES.CHANGE_PASSWORD, userAuth, profileController.renderChangePasswordPage);
router.post(ROUTES.CHANGE_PASSWORD_DIRECT, userAuth, profileController.changePasswordDirect);
router.post(ROUTES.CHANGE_PASSWORD, userAuth, profileController.changePasswordValid);
router.post(ROUTES.VERIFY_CHANGE_PASSWORD_OTP, userAuth, profileController.verifyChangepassOtp);
router.post(ROUTES.RESET_PASSWORD, userAuth, profileController.resetPassword);
router.post(ROUTES.CHANGE_PASSWORD_DIRECT, userAuth, profileController.changePasswordDirect);

//Address Management...............................................................................................

router.get(ROUTES.ADD_ADDRESS, profileController.addAddress);
router.post(ROUTES.POST_ADD_ADDRESS, profileController.postAddAddress);
router.get(ROUTES.USER_ADDRESS, blockGuests, profileController.getAddressPage);
router.get(ROUTES.EDIT_ADDRESS, profileController.editAddress);
router.post(ROUTES.POST_EDIT_ADDRESS, profileController.postEditAddress);
router.post(ROUTES.DELETE_ADDRESS, profileController.deleteAddress);


//wishlist Management...............................................................................................

router.get(ROUTES.WISHLIST, userAuth, blockGuests, wishlistController.loadWishlist);
router.post(ROUTES.ADD_TO_WISHLIST, userAuth, blockGuests, wishlistController.addToWishlist)
router.delete(ROUTES.REMOVE_FROM_WISHLIST, wishlistController.removeFromWishlist);

//shoping management...............................................................................................



//cart management...............................................................................................

router.post(ROUTES.ADD_TO_CART, userAuth, cartController.addToCart);
router.get(ROUTES.CART, cartController.getCart);
router.post(ROUTES.UPDATE_CART_QUANTITY, userAuth, cartController.updateQuantity);
router.post(ROUTES.REMOVE_FROM_CART, userAuth, cartController.removeFromCart);

//checkoutpage...................................................................................................
router.get(ROUTES.CHECKOUT, userAuth, blockGuests, checkoutController.getcheckoutPage);
router.post(ROUTES.CHECKOUT, userAuth, blockGuests, checkoutController.postCheckout);
router.get(ROUTES.ORDER_CONFIRMATION, checkoutController.orderConfirm);
router.post(ROUTES.VERIFY_PAYMENT, userAuth, checkoutController.verifyPayment);
router.post(ROUTES.RETRY_PAYMENT, userAuth, checkoutController.retryPayment);


//order management...............................................................................................

router.get(ROUTES.ORDER_HISTORY, orderController.getOrderHistory);
router.post(ROUTES.CANCEL_ORDER, orderController.cancelOrder);
router.get(ROUTES.ORDER_STATUS, orderController.getOrderStatus);
router.get(ROUTES.ORDER_DETAILS, orderController.getOrderDetails);
router.put(ROUTES.CHANGE_ORDER_STATUS, orderController.changeOrderStatus);
router.get(ROUTES.VIEW_ORDER_DETAILS, orderController.viewOrderDetails);
router.post(ROUTES.UPDATE_ORDER_STATUS, orderController.updateOrderStatus);
router.get(ROUTES.RETURN_REASON, orderController.showReturnReasonPage);
router.post(ROUTES.PROCESS_RETURN, orderController.submitReturnReason);
router.post(ROUTES.UPDATE_STATUS_RAW, orderController.updateOrderStatus);
router.get(ROUTES.RETURN_REASON_BY_ID, orderController.showReturnReasonPage);
router.post(ROUTES.UPDATE_WALLET_AFTER_PAYMENT, walletController.updateWalletAfterPayment);
router.post(ROUTES.PROCESS_RETURN_BY_ID, walletController.processReturn);
router.get(ROUTES.ORDER_PRODUCTS, orderController.getOrderProducts);
router.post(ROUTES.CANCEL_ORDER_PRODUCTS, orderController.cancelOrderProducts);
router.post(ROUTES.RETURN_ORDER_PRODUCTS, orderController.returnOrderProducts);

router.get(ROUTES.DOWNLOAD_INVOICE, orderController.downloadInvoice);

// wallet.........................................................................................................................

router.post(ROUTES.ADD_MONEY, walletController.createRazorpayOrder);
router.post(ROUTES.UPDATE_BALANCE, walletController.updateWalletBalance);
router.post(ROUTES.WALLET_REFUND, walletController.refundToWallet);
// coupon.........................................................................................................................
router.post(ROUTES.APPLY_COUPON, checkoutController.applyCoupon);

// reviews.........................................................................................................................
router.post(ROUTES.SUBMIT_REVIEW, userAuth, productController.addReview);

module.exports = router