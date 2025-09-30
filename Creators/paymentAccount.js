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
      enum: ["crypto"], // Only crypto method allowed
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    cryptoType: {
      type: String,
      enum: ["BTC", "USDT_TRC20", "USDT_ERC20"],
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.creator("PaymentAccount", paymentAccountSchema);