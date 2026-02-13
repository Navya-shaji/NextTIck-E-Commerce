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



//Error Management.......................
router.get("/pageerror", adminController.pageerror)

//login Management...................
router.get("/login", adminController.loadLogin)
router.post("/login", adminController.login)
router.get("/", adminAuth, dashboardController.loadDashboard)
router.get("/logout", adminController.logout);

//Dashboard Management.......................
router.get("/dashboard", adminAuth, dashboardController.loadDashboard)
router.get("/dashboard/sales-data", adminAuth, dashboardController.getSalesData)
router.get("/dashboard/top-products", adminAuth, dashboardController.getTopProducts)
router.get("/dashboard/top-categories", adminAuth, dashboardController.getTopCategories)
router.get("/dashboard/top-brands", adminAuth, dashboardController.getTopBrands)

//Customer Management.......................
router.get("/users", adminAuth, customerController.customerInfo);
router.get("/block/:id", adminAuth, customerController.customerBlocked);
router.get("/unblock/:id", adminAuth, customerController.customerunBlocked);

//Category Management.....................
router.get("/category", adminAuth, categoryController.categoryInfo);
router.post("/addCategory", adminAuth, categoryController.addCategory);
router.post("/addCategoryOffer", adminAuth, categoryController.addCategoryOffer)
router.post("/removeCategoryOffer", adminAuth, categoryController.removeCategoryOffer)
router.get("/listCategory", adminAuth, categoryController.getUnlistedCategory);
router.get("/unlistCategory", adminAuth, categoryController.getListedCategory);
router.get("/editCategory", adminAuth, categoryController.getEditCategory)
router.post("/editCategory/:id", adminAuth, categoryController.editCategory);


//Brand Management.........................
router.get("/brands", adminAuth, brandController.getBrandPage);
router.post("/addBrand", adminAuth, productUploads.single("image"), brandController.addBrand);
router.post('/blockBrand/:id', adminAuth, brandController.blockBrand);
router.post("/unblockBrand/:id", adminAuth, brandController.unblockBrand);
router.post("/deleteBrand", adminAuth, brandController.deleteBrand)

//Product Management...........................
router.get("/addProducts", adminAuth, productController.getProductAddPage);
router.post("/addProducts", adminAuth, productUploads.array("images", 4), productController.addProducts);
router.get("/products", adminAuth, productController.getAllProducts)
router.post("/addProductOffer", adminAuth, productController.addProductOffer)
router.post("/removeProductOffer", adminAuth, productController.removeProductOffer)
router.get("/blockProduct", adminAuth, productController.blockProduct);
router.get("/unblockProduct", adminAuth, productController.unblockProduct);
router.get("/editProduct", adminAuth, productController.getEditProduct);
router.post("/editProduct/:id", adminAuth, productUploads.array("image", 4), productController.editProduct);
router.post("/deleteImage", adminAuth, productController.deleteSingleImage);
router.post("/addProductImage", adminAuth, productUploads.single("images"), productController.addProductImage);
router.post('/product/edit/:id',
    productUploads.array('productImage', 4),
    productController.updateProduct
);


//  orders.................
router.get('/orderList', adminAuth, orderController.listOrders);
router.get('/orders/cancelled', adminAuth, orderController.getCancelledOrders);
router.get('/orders/:orderId', adminAuth, orderController.getAdminOrderDetails);
router.post('/orders/update-status', adminAuth, orderController.updateOrderStatus);
router.post('/orders/update-item-status', adminAuth, orderController.updateItemStatus);
router.post('/orders/cancel-order', adminAuth, orderController.cancelOrderAdmin);
router.post('/orders/delete-order', adminAuth, orderController.deleteOrderAdmin);


//coupon Management ............


router.get("/coupon", adminAuth, couponController.loadcoupon);
router.post("/createCoupon", adminAuth, couponController.createCoupon);
router.get("/editCoupon", adminAuth, couponController.editCoupon);
router.post("/updateCoupon", adminAuth, couponController.updateCoupon);
router.delete("/deleteCoupon/:id", adminAuth, couponController.deleteCoupon);


//Banner Management........................
router.get("/banners", adminAuth, bannerController.loadBanners);
router.post("/addBanner", adminAuth, bannerUploads.single("image"), bannerController.addBanner);
router.post("/toggleBannerStatus/:id", adminAuth, bannerController.toggleBannerStatus);
router.delete("/deleteBanner/:id", adminAuth, bannerController.deleteBanner);


//Admin DashBoard & Sales Report................................
router.get('/sales-report', adminAuth, adminController.loadSalesReport);
router.post('/sales-report/generate', adminAuth, adminController.generateSalesReport);
router.get('/sales-report/download', adminAuth, adminController.downloadSalesReport);


module.exports = router