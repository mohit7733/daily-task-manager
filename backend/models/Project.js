const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        Teamlead: {
            type: String,
            required: true,
        },
        createdAt: { type: Date, default: Date.now },
    }, {
    timestamps: true
});

module.exports = mongoose.model('Projects', projectSchema);