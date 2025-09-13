const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceId: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    payAddress: {
      type: String,
      required: true,
    },
    payinExtraId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "confirming", "confirmed", "sending", "partially_paid", "finished", "failed", "refunded", "expired"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);