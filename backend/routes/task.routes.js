const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  reorderTasks
} = require('../controllers/task.controller');

router.route('/')
  .post(protect, createTask)
  .get(protect, getTasks);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.post('/:id/comments', protect, addComment);
router.post('/reorder', protect, reorderTasks);

module.exports = router;