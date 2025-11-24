const mongoose = require('mongoose');

const standupSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  completedYesterday: {
    type: String,
    required: [true, 'Please describe what you completed yesterday'],
    trim: true
  },
  planToday: {
    type: String,
    required: [true, 'Please describe what you plan to do today'],
    trim: true
  },
  blockers: {
    type: String,
    default: 'None',
    trim: true
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

// Index for efficient queries
standupSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Standup', standupSchema);

