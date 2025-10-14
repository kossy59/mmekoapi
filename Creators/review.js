const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  creatorId: {
    type: String,
    required: true
  },
  fanId: {
    type: String,
    required: true
  },
  fanName: {
    type: String,
    required: true
  },
  fanNickname: {
    type: String,
    default: ""
  },
  fanPhoto: {
    type: String,
    default: ""
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true,
    maxlength: 100
  },
  hostType: {
    type: String,
    default: "Fan Meet"
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

// Index for efficient queries
reviewSchema.index({ creatorId: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1 });

module.exports = mongoose.model("Review", reviewSchema);