const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
  reorderColumns
} = require('../controllers/column.controller');

router.route('/')
  .post(protect, createColumn)
  .get(protect, getColumns);

router.route('/:id')
  .put(protect, updateColumn)
  .delete(protect, deleteColumn);

router.post('/reorder', protect, reorderColumns);

module.exports = router;