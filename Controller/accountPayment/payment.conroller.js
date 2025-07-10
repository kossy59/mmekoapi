const PaymentAccount = require("../../Models/paymentAccount");
const mongoose = require("mongoose"); // Add this if not already

exports.savePaymentAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      method,
      fullName,
      email,
      phone,
      country,
      currency,
      bankName,
      accountNumber,
      accountHolder,
      payoneerEmail,
    } = req.body;

    // Validate required fields
    if (!method || !country || !currency) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Check if user already has this method
    const existing = await PaymentAccount.findOne({ userId, method });
    if (existing) {
      return res.status(400).json({ message: `You have already added a ${method} account.` });
    }

    // Prepare account data
    let accountData = {
      userId,
      method,
      fullName,
      email,
      phone,
      country,
      currency,
    };

    if (method === "wise") {
      if (!bankName || !accountNumber || !accountHolder) {
        return res.status(400).json({ message: "Wise account details missing" });
      }
      accountData = { ...accountData, bankName, accountNumber, accountHolder };
    }

    if (method === "payoneer") {
      if (!payoneerEmail) {
        return res.status(400).json({ message: "Payoneer email is required" });
      }
      accountData = { ...accountData, payoneerEmail };
    }

    // ✅ Save new payment method
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

    // Convert to ObjectId
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const account = await PaymentAccount.findOne({ userId });

    if (!account) {
      return res.status(404).json({ exists: false, message: "No payment account found" });
    }

    res.status(200).json({ exists: true, account });
  } catch (err) {
    console.error("Check account error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deletePaymentAccount = async (req, res) => {
  try {
    const userId = req.params.userId;

    const deleted = await PaymentAccount.findOneAndDelete({ userId });

    if (!deleted) {
      return res.status(404).json({ message: "No payment account found to delete." });
    }

    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Server error while deleting account." });
  }
};
