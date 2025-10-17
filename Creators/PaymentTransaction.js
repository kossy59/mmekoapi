const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payCurrency: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "confirming", "confirmed", "finished", "failed", "expired", "completed"],
      default: "waiting",
    },
    description: {
      type: String,
      required: false,
    },
    invoiceUrl: {
      type: String,
      required: false,
    },
    txData: {
      type: Object, // store NOWPayments response data
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
