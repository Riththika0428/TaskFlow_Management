const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  removeMember
} = require('../controllers/workspace.controller');

router.route('/')
  .post(protect, createWorkspace)
  .get(protect, getWorkspaces);

router.route('/:id')
  .get(protect, getWorkspace)
  .put(protect, updateWorkspace)
  .delete(protect, deleteWorkspace);

router.post('/:id/invite', protect, inviteMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;