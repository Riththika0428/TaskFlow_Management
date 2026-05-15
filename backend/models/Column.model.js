const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Column title is required'],
    trim: true,
    maxlength: [50, 'Title cannot exceed 50 characters']
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

columnSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Column', columnSchema);