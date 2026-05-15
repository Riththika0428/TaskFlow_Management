const Column = require('../models/Column.model');
const Board = require('../models/Board.model');
const Task = require('../models/Task.model');

// @desc    Create column
// @route   POST /api/columns
// @access  Private
const createColumn = async (req, res) => {
  try {
    const { title, board } = req.body;
    
    // Check board exists
    const boardDoc = await Board.findById(board);
    if (!boardDoc) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Get order for new column
    const columnCount = await Column.countDocuments({ board });
    
    const column = await Column.create({
      title,
      board,
      order: columnCount
    });
    
    // Add column to board
    boardDoc.columns.push(column._id);
    await boardDoc.save();
    
    res.status(201).json({ success: true, column });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get columns by board
// @route   GET /api/columns
// @access  Private
const getColumns = async (req, res) => {
  try {
    const { board } = req.query;
    const columns = await Column.find({ board }).sort('order');
    
    res.json({ success: true, columns });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update column
// @route   PUT /api/columns/:id
// @access  Private
const updateColumn = async (req, res) => {
  try {
    const { title } = req.body;
    
    const column = await Column.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true, runValidators: true }
    );
    
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }
    
    res.json({ success: true, column });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete column
// @route   DELETE /api/columns/:id
// @access  Private
const deleteColumn = async (req, res) => {
  try {
    const column = await Column.findById(req.params.id);
    
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }
    
    // Delete all tasks in column
    await Task.deleteMany({ column: column._id });
    
    // Remove column from board
    await Board.findByIdAndUpdate(column.board, {
      $pull: { columns: column._id }
    });
    
    await column.deleteOne();
    
    res.json({ success: true, message: 'Column deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reorder columns
// @route   POST /api/columns/reorder
// @access  Private
const reorderColumns = async (req, res) => {
  try {
    const { columns } = req.body;
    
    for (const column of columns) {
      await Column.findByIdAndUpdate(column.id, { order: column.order });
    }
    
    res.json({ success: true, message: 'Columns reordered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
  reorderColumns
};