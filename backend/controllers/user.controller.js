const User = require('../models/User.model');
const Workspace = require('../models/Workspace.model');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('workspaces', 'name description');
    
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, profileImage } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (profileImage) user.profileImage = profileImage;
    
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get workspace users
// @route   GET /api/users/workspace-users
// @access  Private
const getWorkspaceUsers = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    }).populate('members.user', 'name email profileImage');
    
    const users = new Map();
    
    workspaces.forEach(workspace => {
      workspace.members.forEach(member => {
        if (member.user && !users.has(member.user._id.toString())) {
          users.set(member.user._id.toString(), {
            _id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            profileImage: member.user.profileImage
          });
        }
      });
    });
    
    res.json({ success: true, users: Array.from(users.values()) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getWorkspaceUsers
};