const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Helpers
const buildDateRange = (date) => {
  if (!date) return null;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { $gte: start, $lt: end };
};

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').trim().notEmpty().withMessage('Project is required'),
    body('assignee')
      .optional()
      .isMongoId()
      .withMessage('Assignee must be a valid user id'),
    body('status')
      .optional()
      .isIn(['todo', 'in-progress', 'done', 'blocked'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, project, assignee, status, priority, dueDate } =
        req.body;

      let assigneeId = assignee;

      // Members can only assign tasks to themselves
      if (req.user.role === 'member') {
        assigneeId = req.user._id;
      } else if (!assigneeId) {
        assigneeId = req.user._id;
      }

      // Validate assignee exists
      const assigneeUser = await User.findById(assigneeId);
      if (!assigneeUser) {
        return res.status(400).json({ message: 'Assignee user not found' });
      }

      const task = await Task.create({
        title,
        description,
        project,
        assignee: assigneeId,
        createdBy: req.user._id,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      const populated = await Task.findById(task._id)
        .populate('assignee', 'name email role team')
        .populate('createdBy', 'name email role team');

      res.status(201).json(populated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/tasks/my
// @desc    Get tasks assigned to current user
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const { status, project, date } = req.query;
    const query = { assignee: req.user._id };

    if (status) query.status = status;
    if (project) query.project = project;

    const dateRange = buildDateRange(date);
    if (dateRange) {
      query.dueDate = dateRange;
    }

    const tasks = await Task.find(query)
      .populate('assignee', 'name email role team')
      .populate('createdBy', 'name email role team')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/team
// @desc    Get tasks for team (lead/admin)
// @access  Private (Lead/Admin)
router.get('/team', protect, authorize('lead', 'admin'), async (req, res) => {
  try {
    const { status, project, date, team, assignee } = req.query;
    const query = {};

    if (status) query.status = status;
    if (project) query.project = project;
    if (assignee) query.assignee = assignee;

    const dateRange = buildDateRange(date);
    if (dateRange) {
      query.dueDate = dateRange;
    }

    let tasks = await Task.find(query)
      .populate('assignee', 'name email role team')
      .populate('createdBy', 'name email role team')
      .sort({ dueDate: 1, createdAt: -1 });

    // Team filter in memory based on populated assignee
    if (team) {
      tasks = tasks.filter((t) => t.assignee && t.assignee.team === team);
    }

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a single task
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email role team')
      .populate('createdBy', 'name email role team');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isOwner =
      task.assignee.toString() === req.user._id.toString() ||
      task.createdBy.toString() === req.user._id.toString();
    const isLeadOrAdmin = ['lead', 'admin'].includes(req.user.role);

    if (!isOwner && !isLeadOrAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  '/:id',
  protect,
  [
    body('title').optional().trim().notEmpty(),
    body('project').optional().trim().notEmpty(),
    body('assignee').optional().isMongoId(),
    body('status').optional().isIn(['todo', 'in-progress', 'done', 'blocked']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const isOwner =
        task.assignee.toString() === req.user._id.toString() ||
        task.createdBy.toString() === req.user._id.toString();
      const isLeadOrAdmin = ['lead', 'admin'].includes(req.user.role);

      if (!isOwner && !isLeadOrAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const { title, description, project, assignee, status, priority, dueDate } =
        req.body;

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (project !== undefined) task.project = project;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;

      if (assignee !== undefined) {
        if (req.user.role === 'member' && assignee !== req.user._id.toString()) {
          return res
            .status(403)
            .json({ message: 'Members can only assign tasks to themselves' });
        }
        const assigneeUser = await User.findById(assignee);
        if (!assigneeUser) {
          return res.status(400).json({ message: 'Assignee user not found' });
        }
        task.assignee = assignee;
      }

      const updated = await task.save();
      const populated = await Task.findById(updated._id)
        .populate('assignee', 'name email role team')
        .populate('createdBy', 'name email role team');

      res.json(populated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;


