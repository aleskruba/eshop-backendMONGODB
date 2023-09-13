const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  idUser: {
    type: mongoose.Schema.Types.ObjectId, // Using ObjectId for user references
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  stars: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now, // Default to the current date
    required: true,
  },
});

const Comment = mongoose.model('Comment', commentSchema); // Use 'Comment' as the model name

module.exports = Comment;
