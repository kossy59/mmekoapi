const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userActivitySchema = new Schema(
  {
    userid: {
      type: String,
      required: true,
      index: true, // Index for faster queries
    },
    date: {
      type: Date,
      required: true,
      index: true, // Index for date queries
    },
    // Total time spent in milliseconds
    totalTimeSpent: {
      type: Number,
      default: 0,
    },
    // Number of posts created this day
    postsCount: {
      type: Number,
      default: 0,
    },
    // Number of activities performed (posts, likes, comments, messages, etc.)
    activitiesCount: {
      type: Number,
      default: 0,
    },
    // Session tracking - array of connection/disconnection times
    sessions: [
      {
        connectedAt: {
          type: Date,
          required: true,
        },
        disconnectedAt: {
          type: Date,
          required: false,
        },
        duration: {
          type: Number, // Duration in milliseconds
          default: 0,
        },
      },
    ],
    // Activity breakdown
    activityBreakdown: {
      posts: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      messages: { type: Number, default: 0 },
      profileViews: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries by user and date
userActivitySchema.index({ userid: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("UserActivity", userActivitySchema);

