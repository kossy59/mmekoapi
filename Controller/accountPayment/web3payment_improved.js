const { ethers } = require("ethers");
const dotenv = require("dotenv");
const PaymentTransaction = require("../../Creators/PaymentTransaction");
const userdb = require("../../Creators/userdb");
const mainbalance = require("../../Creators/mainbalance");

dotenv.config();

// ==================== ENV CONFIG ====================
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const WALLET_ADDRESS = process.env.WALLET_ADDRESS; // Your receiving wallet
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955"; // BSC USDT
// ==================================================

// Setup blockchain connection
let provider;
let contract;

// Initialize Web3 connection
const initializeWeb3 = () => {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    const abi = [
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "function balanceOf(address owner) view returns (uint256)"
    ];
    contract = new ethers.Contract(USDT_CONTRACT, abi, provider);
    console.log("✅ Web3 connection initialized");
    console.log("🔍 Listening for USDT transfers to:", WALLET_ADDRESS);
    return true;
  } catch (error) {
    console.error("❌ Web3 initialization failed:", error);
    return false;
  }
};

// Initialize on module load
initializeWeb3();

/**
 * Credit user's gold balance
 */
const creditUserGold = async (userId, amount) => {
  try {
    // Convert USDT amount to gold (assuming 1 USDT = 1000 gold for example)
    const goldAmount = Math.floor(amount * 1000);
    
    // Update user's gold balance
    await userdb.findByIdAndUpdate(
      userId,
      { $inc: { balance: goldAmount } },
      { new: true }
    );

    console.log(`💰 Credited ${goldAmount} gold to user ${userId}`);
  } catch (error) {
    console.error("❌ Failed to credit user gold:", error);
  }
};

/**
 * IMPROVED: Initialize Web3 listener with collision prevention
 */
exports.initializeWeb3Listener = async () => {
  try {
    if (!WALLET_ADDRESS) {
      console.error("❌ WALLET_ADDRESS not configured in environment variables");
      return false;
    }

    if (!contract) {
      console.error("❌ Web3 contract not initialized");
      return false;
    }

    // Listen for incoming USDT transfers
    contract.on("Transfer", async (from, to, value) => {
      if (to.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
        const amount = Number(ethers.formatUnits(value, 18));
        console.log(`💰 ${amount} USDT received from ${from}`);

        // SOLUTION 1: Use atomic operations to prevent race conditions
        try {
          // Find and update the transaction atomically
          const updatedTx = await PaymentTransaction.findOneAndUpdate(
            {
              amount: amount,
              status: "waiting",
              "txData.paymentMethod": "web3"
            },
            {
              status: "confirmed",
              $set: {
                "txData.fromAddress": from,
                "txData.toAddress": to,
                "txData.amount": amount,
                "txData.confirmedAt": new Date()
              }
            },
            { new: true }
          );

          if (updatedTx) {
            // Credit user's gold balance
            await creditUserGold(updatedTx.userId, amount);
            console.log(`✅ Payment confirmed for order ${updatedTx.orderId} from user ${updatedTx.userId}`);
          } else {
            console.log(`⚠️ No pending transaction found for amount ${amount} USDT from ${from}`);
          }
        } catch (error) {
          console.error("❌ Error processing payment:", error);
        }
      }
    });

    console.log("✅ Web3 listener initialized successfully");
    return true;

  } catch (error) {
    console.error("❌ Failed to initialize Web3 listener:", error);
    return false;
  }
};

/**
 * IMPROVED: Create Web3 payment with unique identifiers
 */
exports.createWeb3Payment = async (req, res) => {
  try {
    const { amount, userId, order_description } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ message: "Missing required fields: amount, userId" });
    }

    if (!WALLET_ADDRESS) {
      return res.status(500).json({ message: "Wallet address not configured" });
    }

    // Create unique order ID with timestamp and user ID
    const orderId = `web3_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment transaction record
    const newTx = new PaymentTransaction({
      userId,
      orderId,
      amount: Number(amount),
      payCurrency: "USDT_BEP20",
      description: order_description || "Gold Pack Purchase",
      status: "waiting",
      txData: {
        type: "web3_payment",
        contractAddress: USDT_CONTRACT,
        network: "BSC",
        walletAddress: WALLET_ADDRESS,
        paymentMethod: "web3",
        // Add unique identifier for this transaction
        transactionId: orderId,
        createdAt: new Date()
      }
    });

    await newTx.save();

    res.status(200).json({
      message: "Web3 payment created",
      orderId,
      walletAddress: WALLET_ADDRESS,
      amount: Number(amount),
      currency: "USDT",
      network: "BSC",
      contractAddress: USDT_CONTRACT,
      instructions: `Send exactly ${amount} USDT (BEP20) to the wallet address above. Your order ID is: ${orderId}. Include this order ID in the transaction memo if possible.`
    });

  } catch (error) {
    console.error("Web3 payment creation error:", error);
    res.status(500).json({
      message: "Web3 payment creation failed",
      error: error.message
    });
  }
};

/**
 * IMPROVED: Check payment status with better validation
 */
exports.checkWeb3PaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const transaction = await PaymentTransaction.findOne({ orderId });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({
      orderId: transaction.orderId,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      txData: transaction.txData
    });

  } catch (error) {
    console.error("Check payment status error:", error);
    res.status(500).json({
      message: "Failed to check payment status",
      error: error.message
    });
  }
};

/**
 * IMPROVED: Cancel Web3 payment with better validation
 */
exports.cancelWeb3Payment = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required"
      });
    }

    // Find the transaction
    const transaction = await PaymentTransaction.findOne({ orderId });
    
    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    // Check if transaction can be cancelled
    if (transaction.status === 'confirmed' || transaction.status === 'finished') {
      return res.status(400).json({
        message: "Cannot cancel confirmed or finished transaction"
      });
    }

    if (transaction.status === 'failed' || transaction.status === 'expired' || transaction.status === 'cancelled') {
      return res.status(400).json({
        message: "Transaction is already cancelled or expired"
      });
    }

    // Update transaction status to cancelled
    transaction.status = 'cancelled';
    transaction.updatedAt = new Date();
    await transaction.save();

    console.log(`✅ Transaction ${orderId} cancelled by user`);

    res.status(200).json({
      message: "Transaction cancelled successfully",
      status: "cancelled"
    });

  } catch (error) {
    console.error("Cancel payment error:", error);
    res.status(500).json({
      message: "Payment cancellation failed",
      error: error.message
    });
  }
};

/**
 * Get wallet USDT balance
 */
exports.getWalletBalance = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    if (!contract) {
      return res.status(500).json({ message: "Web3 not initialized" });
    }

    const balance = await contract.balanceOf(walletAddress);
    const balanceInUSDT = Number(ethers.formatUnits(balance, 18));

    res.status(200).json({
      walletAddress,
      balance: balanceInUSDT,
      currency: "USDT",
      network: "BSC"
    });

  } catch (error) {
    console.error("Get wallet balance error:", error);
    res.status(500).json({
      message: "Failed to get wallet balance",
      error: error.message
    });
  }
};

/**
 * Start listening for payments
 */
exports.startListening = async (req, res) => {
  try {
    if (!contract || !WALLET_ADDRESS) {
      if (res && res.status) {
        res.status(500).json({ message: "Web3 not initialized" });
      }
      return false;
    }

    const success = await exports.initializeWeb3Listener();
    
    if (res && res.status) {
      if (success) {
        res.status(200).json({ message: "Web3 listener started successfully" });
      } else {
        res.status(500).json({ message: "Failed to start Web3 listener" });
      }
    }

    return success;

  } catch (error) {
    console.error("Start listening error:", error);
    if (res && res.status) {
      res.status(500).json({
        message: "Failed to start Web3 listener",
        error: error.message
      });
    }
  }
};

/**
 * Stop listening for payments
 */
exports.stopListening = async (req, res) => {
  try {
    if (contract) {
      contract.removeAllListeners("Transfer");
      console.log("🛑 Web3 listener stopped");
      
      if (res && res.status) {
        res.status(200).json({ message: "Web3 listener stopped successfully" });
      }
      return true;
    } else {
      if (res && res.status) {
        res.status(400).json({ message: "Web3 listener was not running" });
      }
      return false;
    }

  } catch (error) {
    console.error("Stop listening error:", error);
    if (res && res.status) {
      res.status(500).json({
        message: "Failed to stop Web3 listener",
        error: error.message
      });
    }
  }
};

/**
 * IMPROVED: Manual payment verification with better validation
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, fromAddress } = req.body;

    if (!orderId || !fromAddress) {
      return res.status(400).json({ 
        message: "Order ID and from address are required" 
      });
    }

    const transaction = await PaymentTransaction.findOne({ orderId });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status === 'confirmed' || transaction.status === 'finished') {
      return res.status(400).json({ 
        message: "Transaction is already confirmed" 
      });
    }

    // Update transaction with verification data
    transaction.status = 'confirmed';
    transaction.txData = {
      ...transaction.txData,
      fromAddress: fromAddress,
      verifiedAt: new Date(),
      verifiedBy: 'manual'
    };
    await transaction.save();

    // Credit user's gold balance
    await creditUserGold(transaction.userId, transaction.amount);

    console.log(`✅ Payment manually verified for order ${orderId}`);

    res.status(200).json({
      message: "Payment verified successfully",
      status: "confirmed"
    });

  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      message: "Payment verification failed",
      error: error.message
    });
  }
};
