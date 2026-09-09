const Product = require("../models/Product");

/* =========================================
   SIMPLE IN-MEMORY CACHE FOR PRODUCT LISTS
   Regardless of whether the underlying slowness
   turns out to be Atlas region distance, the M0
   free tier's shared resources, or something
   else — this guarantees repeat visits within a
   short window are instant, since products don't
   change every second. Cache clears itself
   automatically whenever a product is added,
   edited, or removed, so it can never show stale
   data after an admin makes a change.
========================================= */

const CACHE_TTL_MS = 120000; // 2 minutes — long enough to meaningfully shield
                              // against a slow/flaky database connection,
                              // short enough that admin changes still show
                              // up quickly for customers browsing the shop
const cache = new Map();

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.time > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCached(key, data) {
    cache.set(key, { data, time: Date.now() });
}

function clearProductCache() {
    cache.clear();
}


// GET /api/products  (public — powers the shop page)
// Supports ?brand=Apple to filter, used by the "Shop By Brand" cards.
// Same $slice fix as the admin list below — only the first image is
// needed for a product card, so only the first image is ever fetched.
async function listProducts(req, res) {
    try {
        const cacheKey = `public:${req.query.brand || "all"}`;
        const cached = getCached(cacheKey);

        if (cached) {
            return res.json({ products: cached });
        }

        // If the admin list has already been fetched recently, derive the
        // public list from that instead of hitting MongoDB again — same
        // underlying data, just filtered down to active products (and by
        // brand if requested). This means as long as EITHER the admin
        // page or a shop page has loaded successfully in the last 30s,
        // the other benefits too, instead of each having to independently
        // survive a slow database round-trip.
        const adminCached = getCached("admin:all");

        if (adminCached) {

            let filtered = adminCached.filter(p => p.status === "active");

            if (req.query.brand) {
                const brandLower = req.query.brand.toLowerCase();
                filtered = filtered.filter(p => (p.brand || "").toLowerCase() === brandLower);
            }

            setCached(cacheKey, filtered);
            return res.json({ products: filtered });

        }

        const filter = { status: "active" };

        if (req.query.brand) {
            filter.brand = new RegExp(`^${req.query.brand}$`, "i");
        }

        const products = await Product.find(filter, { images: { $slice: 1 } })
            .sort({ createdAt: -1 })
            .lean();

        setCached(cacheKey, products);

        res.json({ products });
    } catch (error) {
        res.status(500).json({ message: "Could not load products.", error: error.message });
    }
}

// GET /api/products/:id  (public — product detail page)
async function getProduct(req, res) {
    try {
        const product = await Product.findById(req.params.id);

        if (!product || product.status !== "active") {
            return res.status(404).json({ message: "Product not found." });
        }

        res.json({ product });
    } catch (error) {
        res.status(500).json({ message: "Could not load product.", error: error.message });
    }
}

// GET /api/admin/products  (admin — includes hidden products too)
// GET /api/admin/products  (admin — list view)
// IMPORTANT: only returns the first image, not the full array, and does
// it via MongoDB's own $slice projection so the full array is never
// even pulled out of the database, let alone sent to the browser.
// Product photos are stored as base64 text (see README), so a product
// with a few photos can be several MB on its own — fetching the FULL
// images array for every product at once was almost certainly why this
// specific endpoint (and only this one, since it's the only one
// carrying image data) was timing out. The single-product endpoint
// below still returns everything, since that's only ever loaded once
// at a time for editing.
async function adminListProducts(req, res) {
    try {
        const cached = getCached("admin:all");

        if (cached) {
            return res.json({ products: cached });
        }

        const products = await Product.find({}, { images: { $slice: 1 } })
            .sort({ createdAt: -1 })
            .lean();

        setCached("admin:all", products);

        res.json({ products });
    } catch (error) {
        res.status(500).json({ message: "Could not load products.", error: error.message });
    }
}

// POST /api/admin/products  (admin — add a new product)
async function createProduct(req, res) {
    try {
        const {
            name, brand, category, description, images,
            colors, storage, ram, network, processor,
            wholesalePrice, moq, stock, featured, flashDeal, status
        } = req.body;

        if (!name || !brand || wholesalePrice === undefined) {
            return res.status(400).json({ message: "Name, brand and price are required." });
        }

        const product = await Product.create({
            name,
            brand,
            category,
            description,
            images: Array.isArray(images) ? images : [],
            colors: Array.isArray(colors) ? colors : [],
            storage,
            ram,
            network,
            processor,
            wholesalePrice: Number(wholesalePrice),
            moq: moq ? Number(moq) : 5,
            stock: stock ? Number(stock) : 0,
            featured: Boolean(featured),
            flashDeal: Boolean(flashDeal),
            status: status === "hidden" ? "hidden" : "active"
        });

        clearProductCache();
        res.status(201).json({ message: "Product added.", product });
    } catch (error) {
        res.status(500).json({ message: "Could not add product.", error: error.message });
    }
}

// PUT /api/admin/products/:id  (admin — edit a product)
async function updateProduct(req, res) {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        clearProductCache();
        res.json({ message: "Product updated.", product });
    } catch (error) {
        res.status(500).json({ message: "Could not update product.", error: error.message });
    }
}

// DELETE /api/admin/products/:id  (admin — remove a product for good)
async function deleteProduct(req, res) {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        clearProductCache();
        res.json({ message: "Product deleted." });
    } catch (error) {
        res.status(500).json({ message: "Could not delete product.", error: error.message });
    }
}

module.exports = {
    listProducts,
    getProduct,
    adminListProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
