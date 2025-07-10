const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Adjust if your user model is named differently
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  credentials: {
    type: Object, // You can structure this more if needed
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);
