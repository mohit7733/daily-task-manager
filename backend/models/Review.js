const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    employeeDetails: Object,
    reviewPeriod: String,
    dateOfReview: Date,
    responsibilities: [String],
    performance: [
        {
            category: String,
            rating: Number,
            managerComments: String,
        }
    ],
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
