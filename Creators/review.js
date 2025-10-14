const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true
  },
  creatorId: {
    type: String,
    required: true
  },
  fanId: {
    type: String,
    required: true
  },
  ratingType: {
    type: String,
    required: true,
    enum: ['fan-to-creator', 'creator-to-fan']
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
  creatorName: {
    type: String,
    required: true
  },
  creatorNickname: {
    type: String,
    default: ""
  },
  creatorPhoto: {
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
reviewSchema.index({ fanId: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1, ratingType: 1 }, { unique: true }); // Compound unique index
reviewSchema.index({ ratingType: 1 });

module.exports = mongoose.model("Review", reviewSchema);