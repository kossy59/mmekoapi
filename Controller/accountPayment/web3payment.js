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
 * Verify transaction hash using BscScan API (Previously Etherscan)
 */
const verifyTransactionHash = async (txHash, expectedAmount = null) => {
  try {
    // NOTE: Ensure this key is from BscScan, not Etherscan
    const API_KEY = process.env.ETHERSCAN_API_KEY; 
    
    // UPDATED: Pointing to Binance Smart Chain API instead of Ethereum
    const BSCSCAN_API_URL = "https://api.bscscan.com/api";
    
    if (!API_KEY) {
      console.error("ETHERSCAN_API_KEY (BscScan Key) not configured in environment variables");
      return { valid: false, error: "API key not configured" };
    }

    // Validate transaction hash format
    if (!txHash || typeof txHash !== 'string') {
      return { valid: false, error: "Transaction hash is required" };
    }

    // Check if it's a valid Ethereum/BSC transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return { valid: false, error: "Invalid transaction hash format. Must be 66 characters starting with 0x" };
    }

    console.log(`🔍 [BSCSCAN] Verifying transaction: ${txHash}`);
    if (expectedAmount) {
      console.log(`🔍 [BSCSCAN] Expected amount: ${expectedAmount} USDT`);
    }

    // Get transaction details from BscScan API
    const txResponse = await fetch(
      `${BSCSCAN_API_URL}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${API_KEY}`
    );
    
    if (!txResponse.ok) {
      return { valid: false, error: "Failed to fetch transaction from BscScan" };
    }

    const txData = await txResponse.json();
    
    if (txData.error) {
      return { valid: false, error: `BscScan error: ${txData.error.message}` };
    }

    if (!txData.result) {
      return { valid: false, error: "Transaction not found on BSC. Please check the hash and try again." };
    }

    const tx = txData.result;

    // Validate transaction hash format
    if (!tx.hash || tx.hash !== txHash) {
      return { valid: false, error: "Invalid transaction hash format" };
    }

    // Get transaction receipt to check if it was successful
    const receiptResponse = await fetch(
      `${BSCSCAN_API_URL}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${API_KEY}`
    );

    if (!receiptResponse.ok) {
      return { valid: false, error: "Failed to fetch transaction receipt from BscScan" };
    }

    const receiptData = await receiptResponse.json();
    
    if (receiptData.error) {
      return { valid: false, error: `BscScan receipt error: ${receiptData.error.message}` };
    }

    if (!receiptData.result) {
      return { valid: false, error: "Transaction receipt not found. Transaction may still be pending." };
    }

    const receipt = receiptData.result;

    // Check if transaction was successful
    if (receipt.status !== "0x1") {
      return { valid: false, error: "Transaction failed or was reverted" };
    }

    // Check if transaction is to our wallet
    if (tx.to.toLowerCase() !== WALLET_ADDRESS.toLowerCase()) {
      return { valid: false, error: "Transaction not sent to our wallet" };
    }

    // Get USDT transfer logs from the transaction
    let usdtAmount = 0;
    let fromAddress = null;

    // Parse logs to find USDT transfer
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === USDT_CONTRACT.toLowerCase()) {
          try {
            // Parse the log data manually since we're using BSC Scan API
            // USDT Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
            if (log.topics && log.topics.length === 3) {
              const fromTopic = log.topics[1]; // from address
              const toTopic = log.topics[2];   // to address
              const data = log.data;           // value
              
              // Convert from topic to address (remove 0x and pad)
              const fromAddr = "0x" + fromTopic.slice(26);
              const toAddr = "0x" + toTopic.slice(26);
              
              // Check if this transfer is to our wallet
              if (toAddr.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
                // Convert hex data to decimal
                const valueHex = data.slice(2); // Remove 0x
                const valueBigInt = BigInt("0x" + valueHex);
                usdtAmount = Number(valueBigInt) / Math.pow(10, 18); // USDT has 18 decimals
                fromAddress = fromAddr;
                break;
              }
            }
          } catch (logError) {
            console.error("Error parsing log:", logError);
          }
        }
      }
    }

    if (usdtAmount === 0 || !fromAddress) {
      return { valid: false, error: "No USDT transfer found in transaction" };
    }

    // Amount verification - check if the transaction amount matches expected amount
    if (expectedAmount !== null) {
      // UPDATED: Increased tolerance to 0.2 to allow for small overpayments (e.g., sending 1.06 for a 1.00 order)
      const tolerance = 0.2; 
      
      // Calculate difference
      const amountDifference = Math.abs(usdtAmount - expectedAmount);
      
      // Logic: Only fail if difference is big AND they paid LESS than expected
      // Or if they paid significantly more/less than the tolerance
      if (amountDifference > tolerance) {
        console.log(`❌ [BSCSCAN] Amount mismatch: Expected ${expectedAmount} USDT, got ${usdtAmount} USDT`);
        
        // If they paid LESS than required (outside tolerance), fail them
        if (usdtAmount < expectedAmount) {
             return { 
                valid: false, 
                error: `Amount mismatch. Expected ${expectedAmount} USDT, but transaction shows ${usdtAmount} USDT. Please send the correct amount.` 
             };
        }
        // If they paid MORE (overpayment), we usually accept it, so we log it but don't return false
        console.log(`⚠️ [BSCSCAN] User overpaid. Expected ${expectedAmount}, got ${usdtAmount}. Accepting transaction.`);
      }
      
      console.log(`✅ [BSCSCAN] Amount verified: ${usdtAmount} USDT (Expected: ${expectedAmount})`);
    }

    console.log(`✅ [BSCSCAN] Transaction verified: ${usdtAmount} USDT from ${fromAddress}`);

    return {
      valid: true,
      amount: usdtAmount,
      fromAddress: fromAddress,
      toAddress: WALLET_ADDRESS,
      txHash: txHash,
      blockNumber: parseInt(receipt.blockNumber, 16),
      gasUsed: receipt.gasUsed,
      timestamp: parseInt(tx.timeStamp || (Date.now()/1000), 16) * 1000 // Convert to milliseconds
    };

  } catch (error) {
    console.error('Error verifying transaction hash with BscScan:', error);
    return { valid: false, error: error.message };
  }
};

/**
 * Initialize Web3 listener for server startup (simplified - no auto-processing)
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

    console.log("✅ Web3 connection ready for transaction hash verification");
    console.log(`🔍 Wallet address: ${WALLET_ADDRESS}`);
    console.log(`🔍 USDT Contract: ${USDT_CONTRACT}`);
    return true;

  } catch (error) {
    console.error("❌ Failed to initialize Web3 connection:", error);
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
    
    // Set expiry time to 30 minutes from now
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    // Create payment transaction record
    const newTx = new PaymentTransaction({
      userId,
      orderId,
      amount: Number(amount),
      payCurrency: "USDT_BEP20",
      description: order_description || "Gold Pack Purchase",
      status: "waiting",
      expiresAt: expiresAt,
      txData: {
        type: "web3_payment",
        contractAddress: USDT_CONTRACT,
        network: "BSC",
        walletAddress: WALLET_ADDRESS,
        paymentMethod: "web3"
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
      expiresAt: expiresAt,
      instructions: `Send exactly ${amount} USDT (BEP20) to the wallet address above. After sending, paste your transaction hash to confirm the payment.`
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

    // Check if payment has expired
    if (transaction.expiresAt && new Date() > transaction.expiresAt && transaction.status === 'waiting') {
      console.log(`⏰ [STATUS CHECK] Payment expired, cancelling...`);
      transaction.status = 'expired';
      await transaction.save();
    }

    console.log(`✅ [STATUS CHECK] Transaction found:`);
    console.log(`📊 [STATUS CHECK] - Order ID: ${transaction.orderId}`);
    console.log(`📊 [STATUS CHECK] - User ID: ${transaction.userId}`);
    console.log(`📊 [STATUS CHECK] - Status: ${transaction.status}`);
    
    if (transaction.txData) {
      console.log(`📊 [STATUS CHECK]   - TX Hash: ${transaction.txData.txHash || 'N/A'}`);
    }

    const responseData = {
      orderId: transaction.orderId,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      expiresAt: transaction.expiresAt,
      txData: transaction.txData
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`❌ [STATUS CHECK] Error checking payment status for order ${orderId}:`, error);
    res.status(500).json({
      message: "Failed to check payment status",
      error: error.message
    });
  }
};

/**
 * @desc Verify transaction hash and confirm payment
 * @route POST /api/payment/web3/verify-tx
 */
exports.verifyTransactionHash = async (req, res) => {
  try {
    const { orderId, txHash } = req.body;

    if (!orderId || !txHash) {
      return res.status(400).json({ 
        message: "Missing required fields: orderId, txHash" 
      });
    }

    console.log(`🔍 [TX VERIFY] Starting verification for order: ${orderId}, txHash: ${txHash}`);

    // Find the transaction
    const transaction = await PaymentTransaction.findOne({ orderId });

    if (!transaction) {
      console.log(`❌ [TX VERIFY] Transaction not found for order ID: ${orderId}`);
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if payment has expired
    if (transaction.expiresAt && new Date() > transaction.expiresAt) {
      console.log(`⏰ [TX VERIFY] Payment expired for order: ${orderId}`);
      transaction.status = 'expired';
      await transaction.save();
      return res.status(400).json({ 
        message: "Payment has expired. Please create a new payment.",
        status: "expired"
      });
    }

    // Check if already confirmed
    if (transaction.status === 'confirmed') {
      console.log(`✅ [TX VERIFY] Payment already confirmed for order: ${orderId}`);
      return res.status(200).json({ 
        message: "Payment already confirmed",
        status: "confirmed"
      });
    }

    // Verify the transaction hash with expected amount
    console.log(`🔍 [TX VERIFY] Verifying transaction hash: ${txHash}`);
    console.log(`🔍 [TX VERIFY] Expected amount: ${transaction.amount} USDT`);
    const verification = await verifyTransactionHash(txHash, transaction.amount);

    if (!verification.valid) {
      console.log(`❌ [TX VERIFY] Transaction verification failed: ${verification.error}`);
      
      // Provide more specific error messages based on the error type
      let userMessage = verification.error;
      let statusCode = 400;
      
      if (verification.error.includes("not found") || verification.error.includes("Invalid transaction hash")) {
        userMessage = "Transaction not found on BSC. Please check the hash (ensure it is a BSC/BEP20 transaction) and try again.";
        statusCode = 404;
      } else if (verification.error.includes("failed") || verification.error.includes("reverted")) {
        userMessage = "Transaction failed or was reverted on the blockchain.";
        statusCode = 400;
      } else if (verification.error.includes("not sent to our wallet")) {
        userMessage = "This transaction was not sent to our wallet address.";
        statusCode = 400;
      } else if (verification.error.includes("No USDT transfer found")) {
        userMessage = "No USDT transfer found in this transaction.";
        statusCode = 400;
      } else if (verification.error.includes("Amount mismatch")) {
        userMessage = verification.error; 
        statusCode = 400;
      }
      
      return res.status(statusCode).json({ 
        message: userMessage,
        status: "verification_failed",
        details: verification.error
      });
    }

    // Transaction verified successfully with amount check
    console.log(`✅ [TX VERIFY] Transaction verified via BscScan: ${verification.amount} USDT`);

    // Update transaction with verification details
    transaction.status = "confirmed";
    transaction.txData = {
      ...transaction.txData,
      fromAddress: verification.fromAddress,
      toAddress: verification.toAddress,
      amount: verification.amount,
      txHash: verification.txHash,
      blockNumber: verification.blockNumber,
      gasUsed: verification.gasUsed,
      timestamp: verification.timestamp,
      confirmedAt: new Date(),
      verifiedVia: "BSCSCAN_API"
    };
    await transaction.save();

    // Credit user's gold balance - use the gold amount from the selected pack, not USDT amount
    const goldAmount = await getGoldAmountFromTransaction(transaction);
    await creditUserGold(transaction.userId, goldAmount);

    console.log(`✅ [TX VERIFY] Payment confirmed for order ${orderId} from user ${transaction.userId}`);

    res.status(200).json({
      message: "Payment verified and confirmed successfully",
      status: "confirmed",
      orderId: transaction.orderId,
      amount: verification.amount,
      txHash: verification.txHash,
      fromAddress: verification.fromAddress
    });

  } catch (error) {
    console.error(`❌ [TX VERIFY] Error verifying transaction for order ${orderId}:`, error);
    res.status(500).json({
      message: "Transaction verification failed",
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
 * @desc Process expired payments (cron job function)
 */
exports.processExpiredPayments = async () => {
  try {
    console.log(`🕐 [CRON] Checking for expired payments...`);
    
    const expiredPayments = await PaymentTransaction.find({
      status: "waiting",
      expiresAt: { $lt: new Date() }
    });

    if (expiredPayments.length === 0) {
      console.log(`✅ [CRON] No expired payments found`);
      return { processed: 0 };
    }

    console.log(`⏰ [CRON] Found ${expiredPayments.length} expired payments`);

    let processedCount = 0;
    for (const payment of expiredPayments) {
      try {
        payment.status = "expired";
        await payment.save();
        console.log(`✅ [CRON] Expired payment: ${payment.orderId}`);
        processedCount++;
      } catch (error) {
        console.error(`❌ [CRON] Error expiring payment ${payment.orderId}:`, error);
      }
    }

    console.log(`✅ [CRON] Processed ${processedCount} expired payments`);
    return { processed: processedCount };

  } catch (error) {
    console.error(`❌ [CRON] Error processing expired payments:`, error);
    return { processed: 0, error: error.message };
  }
};

/**
 * @desc Manual trigger for processing expired payments (for testing)
 * @route POST /api/payment/web3/process-expired
 */
exports.manualProcessExpired = async (req, res) => {
  try {
    const result = await exports.processExpiredPayments();
    res.status(200).json({
      message: "Expired payments processed",
      ...result
    });
  } catch (error) {
    console.error("Manual process expired error:", error);
    res.status(500).json({
      message: "Failed to process expired payments",
      error: error.message
    });
  }
};

/**
 * Helper function to get gold amount from transaction description
 */
const getGoldAmountFromTransaction = async (transaction) => {
  try {
    // Extract gold amount from description like "Gold Pack Purchase: 100 Gold"
    const description = transaction.description || "";
    const goldMatch = description.match(/(\d+)\s+Gold/i);
    
    if (goldMatch) {
      const goldAmount = parseInt(goldMatch[1]);
      console.log(`✅ [GOLD] Extracted gold amount: ${goldAmount} from description: "${description}"`);
      return goldAmount;
    }
    
    // Fallback: if no gold amount found in description, use USDT amount as gold
    console.log(`⚠️ [GOLD] No gold amount found in description, using USDT amount as fallback: ${transaction.amount}`);
    return Math.floor(transaction.amount);
    
  } catch (error) {
    console.error("Error extracting gold amount from transaction:", error);
    // Fallback to USDT amount
    return Math.floor(transaction.amount);
  }
};

/**
 * Helper function to credit user's gold balance
 */
const creditUserGold = async (userId, goldAmount) => {
  try {
    console.log(`💰 [GOLD] Crediting ${goldAmount} gold to user ${userId}`);
    
    // Update user's main balance
    const userBalance = await mainbalance.findOne({ userid: userId });
    if (userBalance) {
      userBalance.balance += goldAmount;
      await userBalance.save();
      console.log(`✅ [GOLD] Updated existing balance for user ${userId}: ${userBalance.balance} total`);
    } else {
      // Create new balance record
      await mainbalance.create({
        userid: userId,
        balance: goldAmount
      });
      console.log(`✅ [GOLD] Created new balance record for user ${userId}: ${goldAmount} gold`);
    }

    console.log(`✅ [GOLD] Successfully credited ${goldAmount} gold to user ${userId}`);
    return true;

  } catch (error) {
    console.error("❌ [GOLD] Error crediting user gold:", error);
    return false;
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