const Task = require('../models/Task.model');
const Column = require('../models/Column.model');

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, labels, assignee, column, board } = req.body;
    
    // Get order for new task
    const taskCount = await Task.countDocuments({ column });
    
    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      labels,
      assignee,
      column,
      board,
      order: taskCount,
      activity: [{
        user: req.user._id,
        action: 'created',
        details: `Created task "${title}"`
      }]
    });
    
    // Add task to column
    await Column.findByIdAndUpdate(column, {
      $push: { tasks: task._id }
    });
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('comments.user', 'name email');
    
    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get tasks by column
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { column } = req.query;
    const tasks = await Task.find({ column })
      .sort('order')
      .populate('assignee', 'name email')
      .populate('comments.user', 'name email');
    
    res.json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('comments.user', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, labels, assignee, column } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Track changes for activity log
    const changes = [];
    if (title && title !== task.title) changes.push(`Title changed from "${task.title}" to "${title}"`);
    if (priority && priority !== task.priority) changes.push(`Priority changed from ${task.priority} to ${priority}`);
    if (column && column !== task.column.toString()) changes.push(`Moved to different column`);
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, priority, dueDate, labels, assignee, column },
      { new: true, runValidators: true }
    ).populate('assignee', 'name email');
    
    // Add activity log
    if (changes.length > 0) {
      updatedTask.activity.push({
        user: req.user._id,
        action: 'updated',
        details: changes.join(', ')
      });
      await updatedTask.save();
    }
    
    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Remove task from column
    await Column.findByIdAndUpdate(task.column, {
      $pull: { tasks: task._id }
    });
    
    await task.deleteOne();
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.comments.push({
      user: req.user._id,
      content
    });
    
    task.activity.push({
      user: req.user._id,
      action: 'commented',
      details: `Added a comment`
    });
    
    await task.save();
    
    const updatedTask = await Task.findById(req.params.id)
      .populate('comments.user', 'name email')
      .populate('activity.user', 'name email');
    
    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reorder tasks
// @route   POST /api/tasks/reorder
// @access  Private
const reorderTasks = async (req, res) => {
  try {
    const { updates } = req.body;
    
    for (const update of updates) {
      await Task.findByIdAndUpdate(update.id, { order: update.order });
    }
    
    res.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  reorderTasks
};