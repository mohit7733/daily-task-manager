const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (for leads/admins)
// @access  Private (Lead/Admin only)
router.get('/', protect, authorize('lead', 'admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/team
// @desc    Get users by team
// @access  Private (Lead/Admin only)
router.get('/team', protect, authorize('lead', 'admin'), async (req, res) => {
  try {
    const { team } = req.query;
    let query = {};
    
    if (team) {
      query.team = team;
    }

    const users = await User.find(query).select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

