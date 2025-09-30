const PaymentAccount = require("../../Creators/paymentAccount");
const mongoose = require("mongoose");

exports.savePaymentAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { method, fullName, email, phone, country, currency, cryptoType, walletAddress } = req.body;

    // Validate required fields per the pattern
    if (!method || !fullName || !email || !country || !currency || !cryptoType || !walletAddress) {
      return res.status(400).json({
        message: "Missing required fields: method, fullName, email, country, currency, cryptoType, or walletAddress",
      });
    }

    // Validate method
    if (method !== "crypto") {
      return res.status(400).json({ message: "Only cryptocurrency accounts are supported" });
    }

    // Check if user already has a crypto account
    const existing = await PaymentAccount.findOne({ userId, method });
    if (existing) {
      return res.status(400).json({ message: "You have already added a cryptocurrency account." });
    }

    // Basic wallet address validation (adjust based on needs)
    if (!walletAddress.match(/^[A-Za-z0-9]+$/)) {
      return res.status(400).json({ message: "Invalid wallet address format" });
    }

    // Prepare account data
    const accountData = {
      userId,
      method: "crypto",
      fullName,
      email,
      phone,
      country,
      currency,
      cryptoType,
      walletAddress,
    };

    // Save new payment method
    const saved = await PaymentAccount.create(accountData);

    return res.status(201).json({ message: "Account saved", data: saved });
  } catch (err) {
    console.error("Error saving account:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.checkIfPaymentAccountExists = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const account = await PaymentAccount.findOne({ userId });

    if (!account) {
      return res.status(404).json({ exists: false, message: "No payment account found" });
    }

    return res.status(200).json({ exists: true, account });
  } catch (err) {
    console.error("Check account error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deletePaymentAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const deleted = await PaymentAccount.findOneAndDelete({ userId });

    if (!deleted) {
      return res.status(404).json({ message: "No payment account found to delete" });
    }

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).json({ message: "Server error while deleting account" });
  }
};