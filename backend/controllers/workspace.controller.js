const Workspace = require('../models/Workspace.model');
const User = require('../models/User.model');
const Board = require('../models/Board.model');

// @desc    Create workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin'
      }]
    });
    
    // Add workspace to user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { workspaces: workspace._id }
    });
    
    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('owner', 'name email');
    
    res.status(201).json({ success: true, workspace: populatedWorkspace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user workspaces
// @route   GET /api/workspaces
// @access  Private
const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    }).populate('owner', 'name email')
      .populate('members.user', 'name email');
    
    res.json({ success: true, workspaces });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single workspace
// @route   GET /api/workspaces/:id
// @access  Private
const getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('boards');
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Check if user has access
    const hasAccess = workspace.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    );
    
    if (!hasAccess && workspace.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json({ success: true, workspace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update workspace
// @route   PUT /api/workspaces/:id
// @access  Private
const updateWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Check if user is owner or admin
    const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || (member.role !== 'admin' && workspace.owner.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, description } = req.body;
    if (name) workspace.name = name;
    if (description) workspace.description = description;
    
    await workspace.save();
    
    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate('owner', 'name email');
    
    res.json({ success: true, workspace: updatedWorkspace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
// @access  Private
const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Only owner can delete
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only workspace owner can delete' });
    }
    
    // Delete all boards in workspace
    await Board.deleteMany({ workspace: workspace._id });
    
    // Remove workspace from all users
    await User.updateMany(
      { workspaces: workspace._id },
      { $pull: { workspaces: workspace._id } }
    );
    
    await workspace.deleteOne();
    
    res.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Invite member to workspace
// @route   POST /api/workspaces/:id/invite
// @access  Private
const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Check authorization
    const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || (member.role !== 'admin' && workspace.owner.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Find user to invite
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already member
    const alreadyMember = workspace.members.find(m => m.user.toString() === userToInvite._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }
    
    // Add member
    workspace.members.push({
      user: userToInvite._id,
      role: role || 'member'
    });
    
    await workspace.save();
    
    // Add workspace to user
    await User.findByIdAndUpdate(userToInvite._id, {
      $push: { workspaces: workspace._id }
    });
    
    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate('members.user', 'name email');
    
    res.json({ success: true, workspace: updatedWorkspace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove member from workspace
// @route   DELETE /api/workspaces/:id/members/:userId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Check authorization
    const isOwner = workspace.owner.toString() === req.user._id.toString();
    const isAdmin = workspace.members.find(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Remove member
    workspace.members = workspace.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    
    await workspace.save();
    
    // Remove workspace from user
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { workspaces: workspace._id }
    });
    
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  removeMember
};