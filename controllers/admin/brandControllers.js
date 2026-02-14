const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");

const getBrandPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const query = {
            brandName: { $regex: search, $options: "i" }
        };

        const brandData = await Brand.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalBrands = await Brand.countDocuments(query);
        const totalPages = Math.ceil(totalBrands / limit);

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({
                data: brandData,
                currentPage: page,
                totalPages,
                totalBrands,
                search
            });
        }

        res.render("brands", {
            data: brandData,
            currentPage: page,
            totalPages,
            totalBrands,
            search
        });
    } catch (error) {
        console.error("Error fetching brand data:", error);
        res.redirect("/pageerror");
    }
};

const addBrand = async (req, res) => {
    try {
        const brand = req.body.name;
        const findBrand = await Brand.findOne({ brandName: { $regex: `^${brand}$`, $options: "i" } });

        if (findBrand) {
            return res.status(400).json({ error: "Brand already exists" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Brand image is required" });
        }

        const image = req.file.filename;
        const newBrand = new Brand({
            brandName: brand,
            brandImage: image,
        });
        await newBrand.save();

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ status: true, message: "Brand added successfully" });
        }
        res.redirect("/admin/brands");
    } catch (error) {
        console.error("Error adding brand:", error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ error: "Internal server error" });
        }
        res.redirect("/pageerror");
    }
};

const blockBrand = async (req, res) => {
    try {
        const id = req.params.id || req.query.id;
        await Brand.updateOne({ _id: id }, { $set: { isBlocked: true } });

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ status: true, message: "Brand blocked successfully" });
        }
        res.redirect("/admin/brands");
    } catch (error) {
        console.error("Error blocking brand:", error);
        res.redirect("/pageerror");
    }
};

const unblockBrand = async (req, res) => {
    try {
        const id = req.params.id || req.query.id;
        await Brand.updateOne({ _id: id }, { $set: { isBlocked: false } });

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ status: true, message: "Brand unblocked successfully" });
        }
        res.redirect("/admin/brands");
    } catch (error) {
        console.error("Error unblocking brand:", error);
        res.redirect("/pageerror");
    }
};

const deleteBrand = async (req, res) => {
    try {
        const id = req.params.id || req.query.id;
        if (!id) {
            return res.status(400).json({ error: "ID is required" });
        }
        await Brand.deleteOne({ _id: id });

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ status: true, message: "Brand deleted successfully" });
        }
        res.redirect("/admin/brands");
    } catch (error) {
        console.error("Error deleting brand:", error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ error: "Internal server error" });
        }
        res.redirect("/pageerror");
    }
};

const updateBrand = async (req, res) => {
    try {
        const id = req.body.brandId;
        const brandName = req.body.brandName;
        const imageFile = req.file;

        // Check if another brand with same name exists (case-insensitive)
        const existingBrand = await Brand.findOne({
            brandName: { $regex: `^${brandName}$`, $options: "i" },
            _id: { $ne: id }
        });

        if (existingBrand) {
            return res.status(400).json({ success: false, message: "Brand name already exists" });
        }

        const updateData = { brandName: brandName };
        if (imageFile) {
            updateData.brandImage = imageFile.filename;
        }

        const result = await Brand.updateOne({ _id: id }, { $set: updateData });

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "Brand not found" });
        }

        return res.status(200).json({ success: true, message: "Brand updated successfully" });
    } catch (error) {
        console.error("Error updating brand:", error);
        res.status(500).json({ success: false, message: "Error updating brand", error: error.message });
    }
};

module.exports = {
    getBrandPage,
    addBrand,
    blockBrand,
    unblockBrand,
    deleteBrand,
    updateBrand
};


