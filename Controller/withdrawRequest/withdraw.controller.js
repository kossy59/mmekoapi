const WithdrawRequest = require("../../Models/withdrawRequest");
const PaymentAccount = require("../../Models/paymentAccount");
const User = require("../../Models/userdb"); // Ensure this is the correct path

// Create Withdrawal Request
exports.handleWithdrawRequest = async (req, res) => {
    try {
        // const { userId, amount, credentials } = req.body;
        const amount = req.body.amount;
        const credentials = req.body.credentials;
        const userId = req.userId; // From token only


        if (!userId || !amount || !credentials) {
            return res.status(400).json({ message: "Missing fields" });
        }

        // ✅ Check if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Check if account exists for method
        const accountExists = await PaymentAccount.findOne({
            userId,
            method: credentials.method,
        });

        if (!accountExists) {
            return res.status(404).json({ message: `No ${credentials.method} account found for user` });
        }

        const existingRequest = await WithdrawRequest.findOne({
            userId,
            status: "pending",
        });

        if (existingRequest) {
               console.log("Already has pending request");
            return res.status(409).json({ message: "You already have a pending withdrawal request." });
        }


        const request = new WithdrawRequest({
            userId,
            amount,
            credentials,
        });

        const saved = await request.save();

        res.status(201).json({
            message: "Withdrawal request submitted",
            request: saved,
        });
    } catch (err) {
        console.error("Withdraw error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


exports.getAllWithdrawRequests = async (req, res) => {
    try {
        const requests = await WithdrawRequest.find().sort({ createdAt: -1 });
        res.status(200).json({ requests });
    } catch (err) {
        console.error("Error fetching withdrawal requests:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getWithdrawRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await WithdrawRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.status(200).json({ request });
    } catch (err) {
        console.error("Error fetching request:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Update status to paid
exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await WithdrawRequest.findByIdAndUpdate(
      id,
      { status: "paid" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    res.status(200).json({
      message: "Withdrawal marked as paid",
      updated,
    });
  } catch (err) {
    console.error("Error updating withdrawal status:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.deleteWithdrawRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await WithdrawRequest.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.status(200).json({ message: "Request deleted", deleted });
    } catch (err) {
        console.error("Error deleting request:", err);
        res.status(500).json({ message: "Server error" });
    }
};
