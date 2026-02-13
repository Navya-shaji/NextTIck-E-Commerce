const Banner = require("../../models/bannerSchema");
const fs = require("fs");
const path = require("path");
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require("../../constants/messages");

// Load Banners Page
const loadBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdOn: -1 });
        res.render("banners", { banners });
    } catch (error) {
        console.error("Error loading banners:", error);
        res.status(500).send("Server Error");
    }
};

// Add Banner
const addBanner = async (req, res) => {
    try {
        const { title, description, startDate, endDate, link } = req.body;
        const image = req.file ? req.file.filename : null;

        if (!image) {
            return res.status(400).json({ success: false, message: ERROR_MESSAGES.BANNER_IMAGE_REQUIRED });
        }

        const newBanner = new Banner({
            image,
            title,
            description,
            startDate,
            endDate,
            link: link || '',
            isActive: true
        });

        await newBanner.save();
        res.json({ success: true, message: SUCCESS_MESSAGES.BANNER_ADDED });
    } catch (error) {
        console.error("Error adding banner:", error);
        res.status(500).json({ success: false, message: ERROR_MESSAGES.BANNER_ADD_FAILED });
    }
};

// Toggle Banner Status
const toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ success: false, message: ERROR_MESSAGES.BANNER_NOT_FOUND });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        res.json({ success: true, message: SUCCESS_MESSAGES.BANNER_UPDATED, isActive: banner.isActive });
    } catch (error) {
        console.error("Error toggling banner status:", error);
        res.status(500).json({ success: false, message: ERROR_MESSAGES.BANNER_UPDATE_FAILED });
    }
};

// Edit Banner
const editBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, startDate, endDate, link } = req.body;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ success: false, message: ERROR_MESSAGES.BANNER_NOT_FOUND });
        }

        // Update banner fields
        banner.title = title;
        banner.description = description;
        banner.startDate = startDate;
        banner.endDate = endDate;
        banner.link = link || '';

        // If new image is uploaded, delete old image and update
        if (req.file) {
            const oldImagePath = path.join(__dirname, "../../public/uploads/banners", banner.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            banner.image = req.file.filename;
        }

        await banner.save();
        res.json({ success: true, message: SUCCESS_MESSAGES.BANNER_UPDATED });
    } catch (error) {
        console.error("Error editing banner:", error);
        res.status(500).json({ success: false, message: ERROR_MESSAGES.BANNER_UPDATE_FAILED });
    }
};

// Delete Banner
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ success: false, message: ERROR_MESSAGES.BANNER_NOT_FOUND });
        }

        // Delete image file
        const imagePath = path.join(__dirname, "../../public/uploads/banners", banner.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await Banner.findByIdAndDelete(id);
        res.json({ success: true, message: SUCCESS_MESSAGES.BANNER_DELETED });
    } catch (error) {
        console.error("Error deleting banner:", error);
        res.status(500).json({ success: false, message: ERROR_MESSAGES.BANNER_DELETE_FAILED });
    }
};

// Get Active Banners (for frontend)
const getActiveBanners = async (req, res) => {
    try {
        const currentDate = new Date();
        const banners = await Banner.find({
            isActive: true,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        }).sort({ createdOn: -1 });

        res.json({ success: true, banners });
    } catch (error) {
        console.error("Error fetching active banners:", error);
        res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
    }
};

module.exports = {
    loadBanners,
    addBanner,
    editBanner,
    toggleBannerStatus,
    deleteBanner,
    getActiveBanners
};
