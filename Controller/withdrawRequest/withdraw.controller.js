const WithdrawRequest = require("../../Creators/withdrawRequest");
const PaymentAccount = require("../../Creators/paymentAccount");
const User = require("../../Creators/userdb"); // Ensure this is the correct path
const Balancehistory = require("../../Creators/mainbalance");

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
      return res
        .status(404)
        .json({ message: `No ${credentials.method} account found for user` });
    }

    const existingRequest = await WithdrawRequest.findOne({
      userId,
      status: "pending",
    });

    if (existingRequest) {
      return res
        .status(409)
        .json({ message: "You already have a pending withdrawal request." });
    }

    // Calculate earnings to deduct (1 USD = 25 earnings)
    const earningsToDeduct = amount * 25;
    
    // Check if user has enough earnings
    if (userExists.earnings < earningsToDeduct) {
      return res.status(400).json({ 
        message: `Insufficient earnings. You have ${userExists.earnings} earnings but need ${earningsToDeduct} for $${amount} withdrawal.` 
      });
    }

    // Deduct earnings from user
    userExists.earnings -= earningsToDeduct;
    await userExists.save();

    const request = new WithdrawRequest({
      userId,
      amount,
      credentials,
    });

    const saved = await request.save();

    res.status(201).json({
      message: "Withdrawal request submitted and earnings deducted. Transaction history will be created when admin marks as paid.",
      request: saved,
      earningsDeducted: earningsToDeduct,
      remainingEarnings: userExists.earnings,
    });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.getAllWithdrawRequests = async (req, res) => {
//     try {
//         const requests = await WithdrawRequest.find().sort({ createdAt: -1 });
//         res.status(200).json({ requests });
//     } catch (err) {
//         console.error("Error fetching withdrawal requests:", err);
//         res.status(500).json({ message: "Server error" });
//     }
// };

exports.getAllWithdrawRequests = async (req, res) => {
  try {
    // You already have req.userId from the token
    const user = await User.findById(req.userId);
    

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check admin status - handle both boolean and string values
    const isAdmin = user.admin === true || user.admin === "true" || user.admin === 1;
    
    if (!isAdmin) {
      return res.status(403).json({ 
        message: "Forbidden. Admins only.",
        userAdmin: user.admin,
        userAdminType: typeof user.admin
      });
    }

    const requests = await WithdrawRequest.find()
      .populate('userId', 'firstname lastname username')
      .sort({ createdAt: -1 });
    res.status(200).json({ requests });
  } catch (err) {
    console.error("Error fetching withdrawals:", err);
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

// Temporary route to check user admin status
exports.checkAdminStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      userId: req.userId,
      admin: user.admin,
      adminType: typeof user.admin,
      isAdmin: user.admin === true || user.admin === "true" || user.admin === 1
    });
  } catch (err) {
    console.error("Error checking admin status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update status to paid
// exports.markAsPaid = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const updated = await WithdrawRequest.findByIdAndUpdate(
//       id,
//       { status: "paid" },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: "Withdrawal request not found" });
//     }

//     res.status(200).json({
//       message: "Withdrawal marked as paid",
//       updated,
//     });
//   } catch (err) {
//     console.error("Error updating withdrawal status:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// exports.markAsPaid = async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log("Received PATCH /withdraw-request/:id/pay");
//     console.log("ID from req.params:", id);

//     if (!id) {
//       return res.status(400).json({ message: "Missing withdrawal ID" });
//     }

//     const updated = await WithdrawRequest.findByIdAndUpdate(
//       id,
//       { status: "paid" },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: "Withdrawal request not found" });
//     }

//     console.log("Updated withdrawal:", updated);

//     res.status(200).json({
//       message: "Withdrawal marked as paid",
//       updated,
//     });
//   } catch (err) {
//     console.error("Error in markAsPaid:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Missing withdrawal ID" });
    }

    // 1. Find the withdrawal request
    const request = await WithdrawRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    if (request.status === "paid") {
      return res.status(400).json({ message: "Already marked as paid" });
    }

    // 2. Find the user
    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // if (user.balance < request.amount) {
    //   return res.status(400).json({ message: "Insufficient user balance" });
    // }

    // 4. Mark withdrawal as paid (earnings already deducted when request was created)
    request.status = "paid";
    await request.save();

    // 5. Create transaction history only when marked as paid
    const earningsToDeduct = request.amount * 25; // Same calculation as in creation
    const creatorHistory = new Balancehistory({
      userid: request.userId,
      details: `Withdrawal completed: $${request.amount} USD`,
      spent: `${earningsToDeduct}`,
      income: "0",
      date: `${Date.now()}`
    });

    await creatorHistory.save();

    res.status(200).json({
      message: "Withdrawal marked as paid and transaction history created",
      updated: request,
    });
  } catch (err) {
    console.error("Error in markAsPaid:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get latest withdrawal status for a user
exports.getWithdrawStatusByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    const latestRequest = await WithdrawRequest.findOne({ userId }).sort({
      createdAt: -1,
    });

    if (!latestRequest) {
      return res
        .status(404)
        .json({ status: "none", message: "No withdrawal request found" });
    }

    return res.status(200).json({
      status: latestRequest.status,
      message: "Status fetched successfully",
    });
  } catch (err) {
    console.error("Error getting withdraw status:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAllWithdrawRequestsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    const requests = await WithdrawRequest.find({ userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      requests: requests,
      message: "All withdrawal requests fetched successfully",
    });
  } catch (err) {
    console.error("Error getting all withdraw requests:", err);
    return res.status(500).json({ message: "Server error" });
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
