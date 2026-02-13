const Banner = require("../../models/bannerSchema");
const fs = require("fs");
const path = require("path");

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
        const { title, description, link, startDate, endDate } = req.body;
        const image = req.file ? req.file.filename : null;

        if (!image) {
            return res.status(400).json({ success: false, message: "Banner image is required" });
        }

        const newBanner = new Banner({
            image,
            title,
            description,
            link,
            startDate,
            endDate,
            isActive: true
        });

        await newBanner.save();
        res.json({ success: true, message: "Banner added successfully" });
    } catch (error) {
        console.error("Error adding banner:", error);
        res.status(500).json({ success: false, message: "Failed to add banner" });
    }
};

// Toggle Banner Status
const toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        res.json({ success: true, message: "Banner status updated", isActive: banner.isActive });
    } catch (error) {
        console.error("Error toggling banner status:", error);
        res.status(500).json({ success: false, message: "Failed to update banner status" });
    }
};

// Delete Banner
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        // Delete image file
        const imagePath = path.join(__dirname, "../../public/uploads/banners", banner.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await Banner.findByIdAndDelete(id);
        res.json({ success: true, message: "Banner deleted successfully" });
    } catch (error) {
        console.error("Error deleting banner:", error);
        res.status(500).json({ success: false, message: "Failed to delete banner" });
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
        res.status(500).json({ success: false, message: "Failed to fetch banners" });
    }
};

module.exports = {
    loadBanners,
    addBanner,
    toggleBannerStatus,
    deleteBanner,
    getActiveBanners
};
