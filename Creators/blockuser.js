const mongoose = require("mongoose");

const blockUserSchema = new mongoose.Schema({
  blockerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserDB",
    required: true,
    index: true
  },
  blockedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserDB", 
    required: true,
    index: true
  },
  reason: {
    type: String,
    default: "No reason provided"
  },
  blockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique block relationships
blockUserSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

// Index for efficient queries
blockUserSchema.index({ blockerId: 1 });
blockUserSchema.index({ blockedUserId: 1 });

const BlockUser = mongoose.model("BlockUser", blockUserSchema);

module.exports = BlockUser;
