const Board = require('../models/Board.model');
const Workspace = require('../models/Workspace.model');
const Column = require('../models/Column.model');

// @desc    Create board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
  try {
    const { title, description, visibility, workspace } = req.body;
    
    // Check workspace exists and user has access
    const workspaceDoc = await Workspace.findById(workspace);
    if (!workspaceDoc) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const hasAccess = workspaceDoc.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    
    if (!hasAccess && workspaceDoc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const board = await Board.create({
      title,
      description,
      visibility,
      workspace,
      owner: req.user._id
    });
    
    // Add board to workspace
    workspaceDoc.boards.push(board._id);
    await workspaceDoc.save();
    
    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email');
    
    res.status(201).json({ success: true, board: populatedBoard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get boards
// @route   GET /api/boards
// @access  Private
const getBoards = async (req, res) => {
  try {
    const { workspace } = req.query;
    const query = { workspace };
    
    const boards = await Board.find(query)
      .populate('owner', 'name email')
      .populate('columns');
    
    // Filter by visibility and access
    const accessibleBoards = boards.filter(board => {
      if (board.visibility === 'public') return true;
      if (board.visibility === 'private' && board.owner._id.toString() === req.user._id.toString()) return true;
      if (board.visibility === 'team') {
        // Check if user is in workspace
        return true; // Add workspace member check
      }
      return false;
    });
    
    res.json({ success: true, boards: accessibleBoards });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single board
// @route   GET /api/boards/:id
// @access  Private
const getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('columns');
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    res.json({ success: true, board });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
const updateBoard = async (req, res) => {
  try {
    let board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Check ownership
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { title, description, visibility, background } = req.body;
    
    board = await Board.findByIdAndUpdate(
      req.params.id,
      { title, description, visibility, background },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');
    
    res.json({ success: true, board });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Check ownership
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Delete all columns and tasks in board
    await Column.deleteMany({ board: board._id });
    
    // Remove board from workspace
    await Workspace.findByIdAndUpdate(board.workspace, {
      $pull: { boards: board._id }
    });
    
    await board.deleteOne();
    
    res.json({ success: true, message: 'Board deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard
};