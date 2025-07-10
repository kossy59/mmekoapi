const mongoose = require("mongoose");

const paymentAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    method: {
      type: String,
      enum: ["wise", "payoneer"],
      required: true,
    },
    fullName: String,
    email: String,
    phone: String,
    country: String,
    currency: String,

    // Wise-specific fields
    bankName: String,
    accountNumber: String,
    accountHolder: String,

    // Payoneer-specific
    payoneerEmail: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentAccount", paymentAccountSchema);
