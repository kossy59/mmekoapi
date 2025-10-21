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
 * Parse transaction memo from transaction data
 */
const parseTransactionMemo = (data) => {
  try {
    if (!data || data === '0x') return null;
    
    // Remove '0x' prefix and convert to string
    const hexString = data.slice(2);
    const memo = Buffer.from(hexString, 'hex').toString('utf8').replace(/\0/g, '');
    
    return memo.trim() || null;
  } catch (error) {
    console.error('Error parsing transaction memo:', error);
    return null;
  }
};

/**
 * Extract order ID from memo
 */
const extractOrderIdFromMemo = (memo) => {
  try {
    // Look for order ID pattern: web3_userId_timestamp_random
    const orderIdMatch = memo.match(/web3_\w+_\d+_\w+/);
    return orderIdMatch ? orderIdMatch[0] : null;
  } catch (error) {
    console.error('Error extracting order ID from memo:', error);
    return null;
  }
};

/**
 * Initialize Web3 listener for server startup
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
    contract.on("Transfer", async (from, to, value, data) => {
      if (to.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
        const amount = Number(ethers.formatUnits(value, 18));
        console.log(`💰 ${amount} USDT received from ${from}`);

        try {
          // Try to parse memo from transaction data
          const memo = parseTransactionMemo(data);
          console.log(`📝 Transaction memo: ${memo || 'none'}`);

          let transaction = null;

          // Method 1: Try to match by order ID in memo
          if (memo && memo.includes('web3_')) {
            const orderId = extractOrderIdFromMemo(memo);
            if (orderId) {
              console.log(`🔍 Looking for transaction with order ID: ${orderId}`);
              transaction = await PaymentTransaction.findOne({
                orderId: orderId,
                status: "waiting"
              });
              
              if (transaction) {
                console.log(`✅ Found transaction by order ID: ${orderId}`);
              }
            }
          }

          // Method 2: Fallback to amount matching (atomic operation)
          if (!transaction) {
            console.log(`🔍 No memo match, trying amount matching for ${amount} USDT`);
            transaction = await PaymentTransaction.findOneAndUpdate(
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
                  "txData.confirmedAt": new Date(),
                  "txData.memo": memo || null
                }
              },
              { new: true }
            );
          } else {
            // Update the found transaction
            transaction.status = "confirmed";
            transaction.txData = {
              ...transaction.txData,
              fromAddress: from,
              toAddress: to,
              amount: amount,
              confirmedAt: new Date(),
              memo: memo || null
            };
            await transaction.save();
          }

          if (transaction) {
            // Credit user's gold balance
            await creditUserGold(transaction.userId, amount);
            console.log(`✅ Payment confirmed for order ${transaction.orderId} from user ${transaction.userId}`);
          } else {
            console.log(`⚠️ No pending transaction found for amount ${amount} USDT from ${from}`);
            console.log(`📝 Memo was: ${memo || 'none'}`);
          }
        } catch (error) {
          console.error(`❌ Error processing payment from ${from}:`, error);
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
 * @desc Create a Web3 payment request
 * @route POST /api/payment/web3/create
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

    const orderId = `web3_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment transaction record
    const newTx = new PaymentTransaction({
      userId,
      orderId,
      amount: Number(amount),
      payCurrency: "USDT_BEP20",
      description: order_description || "Gold Pack Purchase",
      status: "waiting", // Use "waiting" instead of "pending"
      txData: {
        type: "web3_payment",
        contractAddress: USDT_CONTRACT,
        network: "BSC",
        walletAddress: WALLET_ADDRESS,
        "txData.paymentMethod": "web3"
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
      instructions: `Send exactly ${amount} USDT (BEP20) to the wallet address above. Your order ID is: ${orderId}. Include this order ID in the transaction memo if your wallet supports it.`
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
 * @desc Check payment status by order ID
 * @route GET /api/payment/web3/status/:orderId
 */
exports.checkWeb3PaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`🔍 [STATUS CHECK] Starting status check for order ID: ${orderId}`);
    console.log(`🔍 [STATUS CHECK] Request timestamp: ${new Date().toISOString()}`);

    if (!orderId) {
      console.log(`❌ [STATUS CHECK] No order ID provided`);
      return res.status(400).json({ message: "Order ID is required" });
    }

    console.log(`🔍 [STATUS CHECK] Searching for transaction with order ID: ${orderId}`);
    const transaction = await PaymentTransaction.findOne({ orderId });

    if (!transaction) {
      console.log(`❌ [STATUS CHECK] Transaction not found for order ID: ${orderId}`);
      return res.status(404).json({ message: "Transaction not found" });
    }

    console.log(`✅ [STATUS CHECK] Transaction found:`);
    console.log(`📊 [STATUS CHECK] - Order ID: ${transaction.orderId}`);
    console.log(`📊 [STATUS CHECK] - User ID: ${transaction.userId}`);
    console.log(`📊 [STATUS CHECK] - Status: ${transaction.status}`);
    console.log(`📊 [STATUS CHECK] - Amount: ${transaction.amount}`);
    console.log(`📊 [STATUS CHECK] - Currency: ${transaction.payCurrency}`);
    console.log(`📊 [STATUS CHECK] - Created: ${transaction.createdAt}`);
    console.log(`📊 [STATUS CHECK] - Updated: ${transaction.updatedAt}`);
    console.log(`📊 [STATUS CHECK] - Description: ${transaction.description}`);
    
    if (transaction.txData) {
      console.log(`📊 [STATUS CHECK] - TX Data:`);
      console.log(`📊 [STATUS CHECK]   - Payment Method: ${transaction.txData.paymentMethod || 'N/A'}`);
      console.log(`📊 [STATUS CHECK]   - From Address: ${transaction.txData.fromAddress || 'N/A'}`);
      console.log(`📊 [STATUS CHECK]   - To Address: ${transaction.txData.toAddress || 'N/A'}`);
      console.log(`📊 [STATUS CHECK]   - Confirmed At: ${transaction.txData.confirmedAt || 'N/A'}`);
      console.log(`📊 [STATUS CHECK]   - Memo: ${transaction.txData.memo || 'N/A'}`);
      console.log(`📊 [STATUS CHECK]   - Network: ${transaction.txData.network || 'N/A'}`);
      console.log(`📊 [STATUS CHECK]   - Contract Address: ${transaction.txData.contractAddress || 'N/A'}`);
    }

    const responseData = {
      orderId: transaction.orderId,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      txData: transaction.txData
    };

    console.log(`📤 [STATUS CHECK] Sending response:`);
    console.log(`📤 [STATUS CHECK] - Status: ${responseData.status}`);
    console.log(`📤 [STATUS CHECK] - Amount: ${responseData.amount}`);
    console.log(`📤 [STATUS CHECK] - Has TX Data: ${responseData.txData ? 'Yes' : 'No'}`);

    // Additional check: Verify if any USDT was actually received
    if (transaction.status === 'waiting' && WALLET_ADDRESS) {
      try {
        console.log(`🔍 [WALLET CHECK] Checking wallet balance for: ${WALLET_ADDRESS}`);
        const balance = await contract.balanceOf(WALLET_ADDRESS);
        const balanceInUSDT = Number(ethers.formatUnits(balance, 18));
        console.log(`💰 [WALLET CHECK] Current wallet balance: ${balanceInUSDT} USDT`);
        
        if (balanceInUSDT > 0) {
          console.log(`⚠️ [WALLET CHECK] Wallet has ${balanceInUSDT} USDT but transaction still shows 'waiting'`);
          console.log(`⚠️ [WALLET CHECK] This might indicate a payment was received but not processed`);
        } else {
          console.log(`ℹ️ [WALLET CHECK] No USDT received yet - wallet balance is 0`);
        }
      } catch (walletError) {
        console.error(`❌ [WALLET CHECK] Error checking wallet balance:`, walletError);
      }
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`❌ [STATUS CHECK] Error checking payment status for order ${orderId}:`, error);
    console.error(`❌ [STATUS CHECK] Error details:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      message: "Failed to check payment status",
      error: error.message
    });
  }
};

/**
 * @desc Get user's USDT balance from blockchain
 * @route GET /api/payment/web3/balance/:walletAddress
 */
exports.getWalletBalance = async (req, res) => {
  try {
    const { walletAddress } = req.params;

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
 * @desc Start listening for USDT transfers (call this once on server start)
 * @route POST /api/payment/web3/start-listening
 */
exports.startListening = async (req, res) => {
  try {
    if (!contract || !WALLET_ADDRESS) {
      if (res && res.status) {
        return res.status(500).json({ message: "Web3 not properly configured" });
      }
      throw new Error("Web3 not properly configured");
    }

    // Listen for incoming USDT transfers
    contract.on("Transfer", async (from, to, value) => {
      if (to.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
        const amount = Number(ethers.formatUnits(value, 18));
        console.log(`💰 ${amount} USDT received from ${from}`);

        // Find pending transactions that match this amount
        const pendingTx = await PaymentTransaction.findOne({
          amount: amount,
          status: "waiting",
          "txData.paymentMethod": "web3"
        });

        if (pendingTx) {
          // Update transaction status
          pendingTx.status = "confirmed";
          pendingTx.txData = {
            ...pendingTx.txData,
            fromAddress: from,
            toAddress: to,
            amount: amount,
            confirmedAt: new Date()
          };
          await pendingTx.save();

          // Credit user's gold balance
          await creditUserGold(pendingTx.userId, amount);

          console.log(`✅ Payment confirmed for order ${pendingTx.orderId}`);
        }
      }
    });

    if (res && res.status) {
      res.status(200).json({ 
        message: "Started listening for USDT transfers",
        walletAddress: WALLET_ADDRESS 
      });
    } else {
      console.log("✅ Started listening for USDT transfers");
    }

  } catch (error) {
    console.error("Start listening error:", error);
    if (res && res.status) {
      res.status(500).json({
        message: "Failed to start listening",
        error: error.message
      });
    } else {
      throw error;
    }
  }
};

/**
 * @desc Stop listening for USDT transfers
 * @route POST /api/payment/web3/stop-listening
 */
exports.stopListening = async (req, res) => {
  try {
    if (contract) {
      contract.removeAllListeners("Transfer");
      console.log("🛑 Stopped listening for USDT transfers");
    }

    res.status(200).json({ message: "Stopped listening for USDT transfers" });

  } catch (error) {
    console.error("Stop listening error:", error);
    res.status(500).json({
      message: "Failed to stop listening",
      error: error.message
    });
  }
};

/**
 * Helper function to credit user's gold balance
 */
const creditUserGold = async (userId, usdtAmount) => {
  try {
    // Convert USDT amount to gold (1 USDT = 1 Gold, adjust as needed)
    const goldAmount = Math.floor(usdtAmount);
    
    // Update user's main balance
    const userBalance = await mainbalance.findOne({ userid: userId });
    if (userBalance) {
      userBalance.balance += goldAmount;
      await userBalance.save();
    } else {
      // Create new balance record
      await mainbalance.create({
        userid: userId,
        balance: goldAmount
      });
    }

    console.log(`✅ Credited ${goldAmount} gold to user ${userId}`);
    return true;

  } catch (error) {
    console.error("Error crediting user gold:", error);
    return false;
  }
};

/**
 * @desc Manual payment verification (for testing or manual checks)
 * @route POST /api/payment/web3/verify-payment
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, fromAddress } = req.body;

    if (!orderId || !fromAddress) {
      return res.status(400).json({ message: "Missing orderId or fromAddress" });
    }

    const transaction = await PaymentTransaction.findOne({ orderId });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status === "confirmed") {
      return res.status(200).json({ 
        message: "Payment already confirmed",
        status: "confirmed"
      });
    }

    // Check if payment was received from this address
    if (contract) {
      try {
        const balance = await contract.balanceOf(fromAddress);
        const balanceInUSDT = Number(ethers.formatUnits(balance, 18));
        
        // Simple verification - in production, you'd want more sophisticated checks
        if (balanceInUSDT >= transaction.amount) {
          // Update transaction status
          transaction.status = "confirmed";
          transaction.txData = {
            ...transaction.txData,
            fromAddress: fromAddress,
            verifiedAt: new Date()
          };
          await transaction.save();

          // Credit user's gold balance
          await creditUserGold(transaction.userId, transaction.amount);

          res.status(200).json({ 
            message: "Payment verified and confirmed",
            status: "confirmed"
          });
        } else {
          res.status(400).json({ 
            message: "Insufficient balance for this payment",
            status: "waiting"
          });
        }
      } catch (error) {
        res.status(500).json({ 
          message: "Failed to verify payment",
          error: error.message
        });
      }
    } else {
      res.status(500).json({ message: "Web3 not initialized" });
    }

  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      message: "Payment verification failed",
      error: error.message
    });
  }
};

/**
 * Cancel a Web3 payment transaction
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

    if (transaction.status === 'failed' || transaction.status === 'expired') {
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
