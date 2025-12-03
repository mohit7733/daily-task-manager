const express = require('express');
const { body, validationResult } = require('express-validator');
const Standup = require('../models/Standup');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/standups
// @desc    Create a new standup
// @access  Private
router.post('/', protect, [
  body('completedYesterday').trim().notEmpty().withMessage('Completed yesterday is required'),
  body('planToday').trim().notEmpty().withMessage('Plan for today is required'),
  body('blockers').optional().trim(),
  body('projectName').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { completedYesterday, planToday, blockers, projectName } = req.body;

    // Check if standup already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingStandup = await Standup.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingStandup) {
      // Update existing standup
      existingStandup.completedYesterday = completedYesterday;
      existingStandup.planToday = planToday;
      existingStandup.blockers = blockers || 'None';
      existingStandup.projectName = projectName;
      const updatedStandup = await existingStandup.save();
      return res.json(updatedStandup);
    }

    // Create new standup
    const standup = await Standup.create({
      user: req.user._id,
      date: new Date(),
      completedYesterday,
      planToday,
      projectName,
      blockers: blockers || 'None'
    });

    const populatedStandup = await Standup.findById(standup._id).populate('user', 'name email role team projectName');

    res.status(201).json(populatedStandup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/standups/my-standups
// @desc    Get current user's standups
// @access  Private
router.get('/my-standups', protect, async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    let query = { user: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const standups = await Standup.find(query)
      .populate('user', 'name email role team')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(standups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/standups/today
// @desc    Get today's standup for current user
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const standup = await Standup.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    }).populate('user', 'name email role team');

    if (!standup) {
      return res.json(null);
    }

    res.json(standup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/standups/team
// @desc    Get all team standups (for leads/admins)
// @access  Private (Lead/Admin only)
router.get('/team', protect, authorize('lead', 'admin'), async (req, res) => {
  try {
    const { date, team, userId, project } = req.query;
    let query = {};

    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: filterDate, $lt: nextDay };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    }

    const standups = await Standup.find(query)
      .populate('user', 'name email role team')
      .sort({ 'user.name': 1 });

    // Filter by team if specified
    let filteredStandups = standups;
    if (team) {
      filteredStandups = standups.filter(s => s.user.team === team);
    }
    if (userId) {
      filteredStandups = filteredStandups.filter(
        (s) => s.user && s.user._id.toString() === userId
      );
    }
    if (project) {
      filteredStandups = filteredStandups.filter(s => s.projectName === project);
    }
    res.json(filteredStandups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/standups/:id
// @desc    Get a specific standup
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const standup = await Standup.findById(req.params.id)
      .populate('user', 'name email role team');

    if (!standup) {
      return res.status(404).json({ message: 'Standup not found' });
    }

    // Check if user owns the standup or is lead/admin
    if (standup.user._id.toString() !== req.user._id.toString() &&
      !['lead', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(standup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/standups/:id
// @desc    Update a standup
// @access  Private
router.put('/:id', protect, [
  body('completedYesterday').optional().trim().notEmpty(),
  body('planToday').optional().trim().notEmpty(),
  body('blockers').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const standup = await Standup.findById(req.params.id);

    if (!standup) {
      return res.status(404).json({ message: 'Standup not found' });
    }

    // Check if user owns the standup
    if (standup.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { completedYesterday, planToday, blockers } = req.body;
    if (completedYesterday) standup.completedYesterday = completedYesterday;
    if (planToday) standup.planToday = planToday;
    if (blockers !== undefined) standup.blockers = blockers;

    const updatedStandup = await standup.save();
    const populatedStandup = await Standup.findById(updatedStandup._id)
      .populate('user', 'name email role team');

    res.json(populatedStandup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

