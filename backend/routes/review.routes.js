const express = require("express");
const router = express.Router();
const Review = require("../models/Review");

// Create Review
router.post("/create", async (req, res) => {
    try {
        const review = new Review(req.body);
        await review.save();
        res.status(201).json({ message: "Review saved successfully", review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Reviews
router.get("/list", async (req, res) => {
    try {
        const data = await Review.find().sort({ createdAt: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
