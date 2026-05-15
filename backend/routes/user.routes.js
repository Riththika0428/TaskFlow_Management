const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  changePassword,
  getWorkspaceUsers
} = require('../controllers/user.controller');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/workspace-users', protect, getWorkspaceUsers);

module.exports = router;