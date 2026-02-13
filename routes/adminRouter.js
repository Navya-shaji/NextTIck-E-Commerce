const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin/adminController")
const customerController = require("../controllers/admin/customerController")
const categoryController = require("../controllers/admin/categoryController")
const brandController = require("../controllers/admin/brandControllers")
const productController = require("../controllers/admin/productController")
const orderController = require('../controllers/admin/orderController')
const couponController = require("../controllers/admin/couponController")
const dashboardController = require('../controllers/admin/dashboardController');
const bannerController = require("../controllers/admin/bannerController");
const { userAuth, adminAuth } = require("../middlewares/auth")
const multer = require("multer");
const { productStorage, bannerStorage } = require("../helpers/multer");
const productUploads = multer({ storage: productStorage });
const bannerUploads = multer({ storage: bannerStorage });
const ROUTES = require("../constants/adminRoutes");



//Error Management.......................
router.get(ROUTES.PAGE_ERROR, adminController.pageerror)

//login Management...................
router.get(ROUTES.LOGIN, adminController.loadLogin)
router.post(ROUTES.LOGIN, adminController.login)
router.get(ROUTES.ROOT, adminAuth, dashboardController.loadDashboard)
router.get(ROUTES.LOGOUT, adminController.logout);

//Dashboard Management.......................
router.get(ROUTES.DASHBOARD, adminAuth, dashboardController.loadDashboard)
router.get(ROUTES.SALES_DATA, adminAuth, dashboardController.getSalesData)
router.get(ROUTES.TOP_PRODUCTS, adminAuth, dashboardController.getTopProducts)
router.get(ROUTES.TOP_CATEGORIES, adminAuth, dashboardController.getTopCategories)
router.get(ROUTES.TOP_BRANDS, adminAuth, dashboardController.getTopBrands)

//Customer Management.......................
router.get(ROUTES.USERS, adminAuth, customerController.customerInfo);
router.get(ROUTES.BLOCK_USER, adminAuth, customerController.customerBlocked);
router.get(ROUTES.UNBLOCK_USER, adminAuth, customerController.customerunBlocked);

//Category Management.....................
router.get(ROUTES.CATEGORY, adminAuth, categoryController.categoryInfo);
router.post(ROUTES.ADD_CATEGORY, adminAuth, categoryController.addCategory);
router.post(ROUTES.ADD_CATEGORY_OFFER, adminAuth, categoryController.addCategoryOffer)
router.post(ROUTES.REMOVE_CATEGORY_OFFER, adminAuth, categoryController.removeCategoryOffer)
router.get(ROUTES.LIST_CATEGORY, adminAuth, categoryController.getUnlistedCategory);
router.get(ROUTES.UNLIST_CATEGORY, adminAuth, categoryController.getListedCategory);
router.get(ROUTES.EDIT_CATEGORY, adminAuth, categoryController.getEditCategory)
router.post(ROUTES.EDIT_CATEGORY_BY_ID, adminAuth, categoryController.editCategory);


//Brand Management.........................
router.get(ROUTES.BRANDS, adminAuth, brandController.getBrandPage);
router.post(ROUTES.ADD_BRAND, adminAuth, productUploads.single("image"), brandController.addBrand);
router.post(ROUTES.BLOCK_BRAND, adminAuth, brandController.blockBrand);
router.post(ROUTES.UNBLOCK_BRAND, adminAuth, brandController.unblockBrand);
router.post(ROUTES.DELETE_BRAND, adminAuth, brandController.deleteBrand)

//Product Management...........................
router.get(ROUTES.ADD_PRODUCTS, adminAuth, productController.getProductAddPage);
router.post(ROUTES.ADD_PRODUCTS, adminAuth, productUploads.array("images", 4), productController.addProducts);
router.get(ROUTES.PRODUCTS, adminAuth, productController.getAllProducts)
router.post(ROUTES.ADD_PRODUCT_OFFER, adminAuth, productController.addProductOffer)
router.post(ROUTES.REMOVE_PRODUCT_OFFER, adminAuth, productController.removeProductOffer)
router.get(ROUTES.BLOCK_PRODUCT, adminAuth, productController.blockProduct);
router.get(ROUTES.UNBLOCK_PRODUCT, adminAuth, productController.unblockProduct);
router.get(ROUTES.EDIT_PRODUCT, adminAuth, productController.getEditProduct);
router.post(ROUTES.EDIT_PRODUCT_BY_ID, adminAuth, productUploads.array("image", 4), productController.editProduct);
router.post(ROUTES.DELETE_IMAGE, adminAuth, productController.deleteSingleImage);
router.post(ROUTES.ADD_PRODUCT_IMAGE, adminAuth, productUploads.single("images"), productController.addProductImage);
router.post(ROUTES.UPDATE_PRODUCT,
    productUploads.array('productImage', 4),
    productController.updateProduct
);


//  orders.................
router.get(ROUTES.ORDER_LIST, adminAuth, orderController.listOrders);
router.get(ROUTES.ORDERS_CANCELLED, adminAuth, orderController.getCancelledOrders);
router.get(ROUTES.ORDER_DETAILS, adminAuth, orderController.getAdminOrderDetails);
router.post(ROUTES.UPDATE_ORDER_STATUS, adminAuth, orderController.updateOrderStatus);
router.post(ROUTES.UPDATE_ITEM_STATUS, adminAuth, orderController.updateItemStatus);
router.post(ROUTES.CANCEL_ORDER, adminAuth, orderController.cancelOrderAdmin);
router.post(ROUTES.DELETE_ORDER, adminAuth, orderController.deleteOrderAdmin);


//coupon Management ............


router.get(ROUTES.COUPON, adminAuth, couponController.loadcoupon);
router.post(ROUTES.CREATE_COUPON, adminAuth, couponController.createCoupon);
router.get(ROUTES.EDIT_COUPON, adminAuth, couponController.editCoupon);
router.post(ROUTES.UPDATE_COUPON, adminAuth, couponController.updateCoupon);
router.delete(ROUTES.DELETE_COUPON, adminAuth, couponController.deleteCoupon);


//Banner Management........................
router.get(ROUTES.BANNERS, adminAuth, bannerController.loadBanners);
router.post(ROUTES.ADD_BANNER, adminAuth, bannerUploads.single("image"), bannerController.addBanner);
router.post(ROUTES.EDIT_BANNER, adminAuth, bannerUploads.single("image"), bannerController.editBanner);
router.post(ROUTES.TOGGLE_BANNER_STATUS, adminAuth, bannerController.toggleBannerStatus);
router.delete(ROUTES.DELETE_BANNER, adminAuth, bannerController.deleteBanner);


//Admin DashBoard & Sales Report................................
router.get(ROUTES.SALES_REPORT, adminAuth, adminController.loadSalesReport);
router.post(ROUTES.GENERATE_SALES_REPORT, adminAuth, adminController.generateSalesReport);
router.get(ROUTES.DOWNLOAD_SALES_REPORT, adminAuth, adminController.downloadSalesReport);


module.exports = router