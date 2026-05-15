const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard
} = require('../controllers/board.controller');

router.route('/')
  .post(protect, createBoard)
  .get(protect, getBoards);

router.route('/:id')
  .get(protect, getBoard)
  .put(protect, updateBoard)
  .delete(protect, deleteBoard);

module.exports = router;