// const { ethers } = require("ethers");
// const dotenv = require("dotenv");
// const PaymentTransaction = require("../../Creators/PaymentTransaction");
// const userdb = require("../../Creators/userdb");
// const mainbalance = require("../../Creators/mainbalance");

// dotenv.config();

// // ==================== ENV CONFIG ====================
// const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
// const WALLET_ADDRESS = process.env.WALLET_ADDRESS; // Your receiving wallet
// const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955"; // BSC USDT
// // ==================================================

// // Setup blockchain connection
// let provider;
// let contract;

// // Initialize Web3 connection
// const initializeWeb3 = () => {
//   try {
//     provider = new ethers.JsonRpcProvider(RPC_URL);
//     const abi = [
//       "event Transfer(address indexed from, address indexed to, uint256 value)",
//       "function balanceOf(address owner) view returns (uint256)"
//     ];
//     contract = new ethers.Contract(USDT_CONTRACT, abi, provider);
//     console.log("✅ Web3 connection initialized");
//     console.log("🔍 Listening for USDT transfers to:", WALLET_ADDRESS);
//     return true;
//   } catch (error) {
//     console.error("❌ Web3 initialization failed:", error);
//     return false;
//   }
// };

// // Initialize on module load
// initializeWeb3();

// /**
//  * Credit user's gold balance
//  */
// const creditUserGold = async (userId, amount) => {
//   try {
//     // Convert USDT amount to gold (assuming 1 USDT = 1000 gold for example)
//     const goldAmount = Math.floor(amount * 1000);
    
//     // Update user's gold balance
//     await userdb.findByIdAndUpdate(
//       userId,
//       { $inc: { balance: goldAmount } },
//       { new: true }
//     );

//     console.log(`💰 Credited ${goldAmount} gold to user ${userId}`);
//   } catch (error) {
//     console.error("❌ Failed to credit user gold:", error);
//   }
// };

// /**
//  * IMPROVED: Initialize Web3 listener with collision prevention
//  */
// exports.initializeWeb3Listener = async () => {
//   try {
//     if (!WALLET_ADDRESS) {
//       console.error("❌ WALLET_ADDRESS not configured in environment variables");
//       return false;
//     }

//     if (!contract) {
//       console.error("❌ Web3 contract not initialized");
//       return false;
//     }

//     // Listen for incoming USDT transfers
//     contract.on("Transfer", async (from, to, value) => {
//       if (to.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
//         const amount = Number(ethers.formatUnits(value, 18));
//         console.log(`💰 ${amount} USDT received from ${from}`);

//         // SOLUTION 1: Use atomic operations to prevent race conditions
//         try {
//           // Find and update the transaction atomically
//           const updatedTx = await PaymentTransaction.findOneAndUpdate(
//             {
//               amount: amount,
//               status: "waiting",
//               "txData.paymentMethod": "web3"
//             },
//             {
//               status: "confirmed",
//               $set: {
//                 "txData.fromAddress": from,
//                 "txData.toAddress": to,
//                 "txData.amount": amount,
//                 "txData.confirmedAt": new Date()
//               }
//             },
//             { new: true }
//           );

//           if (updatedTx) {
//             // Credit user's gold balance
//             await creditUserGold(updatedTx.userId, amount);
//             console.log(`✅ Payment confirmed for order ${updatedTx.orderId} from user ${updatedTx.userId}`);
//           } else {
//             console.log(`⚠️ No pending transaction found for amount ${amount} USDT from ${from}`);
//           }
//         } catch (error) {
//           console.error("❌ Error processing payment:", error);
//         }
//       }
//     });

//     console.log("✅ Web3 listener initialized successfully");
//     return true;

//   } catch (error) {
//     console.error("❌ Failed to initialize Web3 listener:", error);
//     return false;
//   }
// };

// /**
//  * IMPROVED: Create Web3 payment with unique identifiers
//  */
// exports.createWeb3Payment = async (req, res) => {
//   try {
//     const { amount, userId, order_description } = req.body;

//     if (!amount || !userId) {
//       return res.status(400).json({ message: "Missing required fields: amount, userId" });
//     }

//     if (!WALLET_ADDRESS) {
//       return res.status(500).json({ message: "Wallet address not configured" });
//     }

//     // Create unique order ID with timestamp and user ID
//     const orderId = `web3_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
//     // Create payment transaction record
//     const newTx = new PaymentTransaction({
//       userId,
//       orderId,
//       amount: Number(amount),
//       payCurrency: "USDT_BEP20",
//       description: order_description || "Gold Pack Purchase",
//       status: "waiting",
//       txData: {
//         type: "web3_payment",
//         contractAddress: USDT_CONTRACT,
//         network: "BSC",
//         walletAddress: WALLET_ADDRESS,
//         paymentMethod: "web3",
//         // Add unique identifier for this transaction
//         transactionId: orderId,
//         createdAt: new Date()
//       }
//     });

//     await newTx.save();

//     res.status(200).json({
//       message: "Web3 payment created",
//       orderId,
//       walletAddress: WALLET_ADDRESS,
//       amount: Number(amount),
//       currency: "USDT",
//       network: "BSC",
//       contractAddress: USDT_CONTRACT,
//       instructions: `Send exactly ${amount} USDT (BEP20) to the wallet address above. Your order ID is: ${orderId}. Include this order ID in the transaction memo if possible.`
//     });

//   } catch (error) {
//     console.error("Web3 payment creation error:", error);
//     res.status(500).json({
//       message: "Web3 payment creation failed",
//       error: error.message
//     });
//   }
// };

// /**
//  * IMPROVED: Check payment status with better validation
//  */
// exports.checkWeb3PaymentStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     if (!orderId) {
//       return res.status(400).json({ message: "Order ID is required" });
//     }

//     const transaction = await PaymentTransaction.findOne({ orderId });

//     if (!transaction) {
//       return res.status(404).json({ message: "Transaction not found" });
//     }

//     res.status(200).json({
//       orderId: transaction.orderId,
//       status: transaction.status,
//       amount: transaction.amount,
//       createdAt: transaction.createdAt,
//       updatedAt: transaction.updatedAt,
//       txData: transaction.txData
//     });

//   } catch (error) {
//     console.error("Check payment status error:", error);
//     res.status(500).json({
//       message: "Failed to check payment status",
//       error: error.message
//     });
//   }
// };

// /**
//  * IMPROVED: Cancel Web3 payment with better validation
//  */
// exports.cancelWeb3Payment = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     if (!orderId) {
//       return res.status(400).json({
//         message: "Order ID is required"
//       });
//     }

//     // Find the transaction
//     const transaction = await PaymentTransaction.findOne({ orderId });
    
//     if (!transaction) {
//       return res.status(404).json({
//         message: "Transaction not found"
//       });
//     }

//     // Check if transaction can be cancelled
//     if (transaction.status === 'confirmed' || transaction.status === 'finished') {
//       return res.status(400).json({
//         message: "Cannot cancel confirmed or finished transaction"
//       });
//     }

//     if (transaction.status === 'failed' || transaction.status === 'expired' || transaction.status === 'cancelled') {
//       return res.status(400).json({
//         message: "Transaction is already cancelled or expired"
//       });
//     }

//     // Update transaction status to cancelled
//     transaction.status = 'cancelled';
//     transaction.updatedAt = new Date();
//     await transaction.save();

//     console.log(`✅ Transaction ${orderId} cancelled by user`);

//     res.status(200).json({
//       message: "Transaction cancelled successfully",
//       status: "cancelled"
//     });

//   } catch (error) {
//     console.error("Cancel payment error:", error);
//     res.status(500).json({
//       message: "Payment cancellation failed",
//       error: error.message
//     });
//   }
// };

// /**
//  * Get wallet USDT balance
//  */
// exports.getWalletBalance = async (req, res) => {
//   try {
//     const { walletAddress } = req.params;

//     if (!walletAddress) {
//       return res.status(400).json({ message: "Wallet address is required" });
//     }

//     if (!contract) {
//       return res.status(500).json({ message: "Web3 not initialized" });
//     }

//     const balance = await contract.balanceOf(walletAddress);
//     const balanceInUSDT = Number(ethers.formatUnits(balance, 18));

//     res.status(200).json({
//       walletAddress,
//       balance: balanceInUSDT,
//       currency: "USDT",
//       network: "BSC"
//     });

//   } catch (error) {
//     console.error("Get wallet balance error:", error);
//     res.status(500).json({
//       message: "Failed to get wallet balance",
//       error: error.message
//     });
//   }
// };

// /**
//  * Start listening for payments
//  */
// exports.startListening = async (req, res) => {
//   try {
//     if (!contract || !WALLET_ADDRESS) {
//       if (res && res.status) {
//         res.status(500).json({ message: "Web3 not initialized" });
//       }
//       return false;
//     }

//     const success = await exports.initializeWeb3Listener();
    
//     if (res && res.status) {
//       if (success) {
//         res.status(200).json({ message: "Web3 listener started successfully" });
//       } else {
//         res.status(500).json({ message: "Failed to start Web3 listener" });
//       }
//     }

//     return success;

//   } catch (error) {
//     console.error("Start listening error:", error);
//     if (res && res.status) {
//       res.status(500).json({
//         message: "Failed to start Web3 listener",
//         error: error.message
//       });
//     }
//   }
// };

// /**
//  * Stop listening for payments
//  */
// exports.stopListening = async (req, res) => {
//   try {
//     if (contract) {
//       contract.removeAllListeners("Transfer");
//       console.log("🛑 Web3 listener stopped");
      
//       if (res && res.status) {
//         res.status(200).json({ message: "Web3 listener stopped successfully" });
//       }
//       return true;
//     } else {
//       if (res && res.status) {
//         res.status(400).json({ message: "Web3 listener was not running" });
//       }
//       return false;
//     }

//   } catch (error) {
//     console.error("Stop listening error:", error);
//     if (res && res.status) {
//       res.status(500).json({
//         message: "Failed to stop Web3 listener",
//         error: error.message
//       });
//     }
//   }
// };

// /**
//  * IMPROVED: Manual payment verification with better validation
//  */
// exports.verifyPayment = async (req, res) => {
//   try {
//     const { orderId, fromAddress } = req.body;

//     if (!orderId || !fromAddress) {
//       return res.status(400).json({ 
//         message: "Order ID and from address are required" 
//       });
//     }

//     const transaction = await PaymentTransaction.findOne({ orderId });

//     if (!transaction) {
//       return res.status(404).json({ message: "Transaction not found" });
//     }

//     if (transaction.status === 'confirmed' || transaction.status === 'finished') {
//       return res.status(400).json({ 
//         message: "Transaction is already confirmed" 
//       });
//     }

//     // Update transaction with verification data
//     transaction.status = 'confirmed';
//     transaction.txData = {
//       ...transaction.txData,
//       fromAddress: fromAddress,
//       verifiedAt: new Date(),
//       verifiedBy: 'manual'
//     };
//     await transaction.save();

//     // Credit user's gold balance
//     await creditUserGold(transaction.userId, transaction.amount);

//     console.log(`✅ Payment manually verified for order ${orderId}`);

//     res.status(200).json({
//       message: "Payment verified successfully",
//       status: "confirmed"
//     });

//   } catch (error) {
//     console.error("Verify payment error:", error);
//     res.status(500).json({
//       message: "Payment verification failed",
//       error: error.message
//     });
//   }
// };
const { ethers } = require("ethers");
const dotenv = require("dotenv");
const PaymentTransaction = require("../../Creators/PaymentTransaction");
const userdb = require("../../Creators/userdb");
const mainbalance = require("../../Creators/mainbalance");

dotenv.config();

// ==================== ENV CONFIG ====================
// Use a reliable BSC RPC URL (Binance Smart Chain)
const RPC_URL = process.env.RPC_URL || "https://bscscan.com";
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "0xFb5E3dFe5015179E549Aec7cF44f561C37a08791"
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955"; // BSC USDT Contract Address
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
    return true;
  } catch (error) {
    console.error("❌ Web3 initialization failed:", error);
    return false;
  }
};

// Initialize on module load
initializeWeb3();

// ==================== HELPER FUNCTIONS ====================

/**
 * Internal Function: Verify transaction hash using BscScan API
 * checks if USDT was sent specifically to YOUR wallet
 */
// const verifyTransactionOnBscScan = async (txHash, expectedAmount = null) => {
//   try {
//     // IMPORTANT: Get this key from BscScan.com
//     const API_KEY = process.env.ETHERSCAN_API_KEY; 
    
//     // CRITICAL: Use BSC endpoint (Not Etherscan.io)
//     const BSCSCAN_API_URL = "https://api.bscscan.com"; 
    
//     if (!API_KEY) return { valid: false, error: "API key not configured" };
//     if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
//       return { valid: false, error: "Invalid transaction hash format" };
//     }

//     console.log(`🔍 [BSCSCAN] Verifying: ${txHash}`);

//     // 1. GET TRANSACTION STATUS
//     const txResponse = await fetch(
//       `${BSCSCAN_API_URL}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${API_KEY}`
//     );
//     const txData = await txResponse.json();
    
//     if (!txData.result) {
//       return { valid: false, error: "Transaction not found on BSC. Ensure you sent via BSC (BEP20)." };
//     }

//     // 2. GET RECEIPT (Confirm success & Logs)
//     const receiptResponse = await fetch(
//       `${BSCSCAN_API_URL}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${API_KEY}`
//     );
//     const receiptData = await receiptResponse.json();
//     const receipt = receiptData.result;

//     if (!receipt || receipt.status !== "0x1") {
//       return { valid: false, error: "Transaction failed or is pending" };
//     }

//     // 3. PARSE LOGS (The Security Check)
//     // We look for a USDT Transfer event where the destination is YOUR wallet
//     let usdtAmount = 0;
//     let fromAddress = null;
//     let foundMyTransfer = false;

//     if (receipt.logs && receipt.logs.length > 0) {
//       for (const log of receipt.logs) {
//         // Check if this log belongs to the USDT Contract
//         if (log.address.toLowerCase() === USDT_CONTRACT.toLowerCase()) {
//           try {
//             // Transfer(from, to, value) has 3 topics
//             if (log.topics && log.topics.length === 3) {
//               const toTopic = log.topics[2];
//               const toAddr = "0x" + toTopic.slice(26); // Unpad address
              
//               // CHECK: Did it go to OUR wallet?
//               if (toAddr.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
//                 const valueBigInt = BigInt(log.data);
//                 usdtAmount = Number(valueBigInt) / 1e18; // USDT decimals
//                 fromAddress = "0x" + log.topics[1].slice(26);
//                 foundMyTransfer = true;
//                 break; // Found it
//               }
//             }
//           } catch (e) { console.error("Log parse error", e); }
//         }
//       }
//     }

//     if (!foundMyTransfer) {
//       return { valid: false, error: "Transaction is valid, but no USDT was sent to YOUR wallet." };
//     }

//     // 4. CHECK AMOUNT (With Tolerance)
//     if (expectedAmount !== null) {
//       const tolerance = 0.2; // Allow 0.2 diff (e.g. 1.06 vs 1.00)
//       const diff = Math.abs(usdtAmount - expectedAmount);
      
//       if (diff > tolerance) {
//         if (usdtAmount < expectedAmount) {
//              return { valid: false, error: `Underpayment. Received ${usdtAmount}, expected ${expectedAmount}.` };
//         }
//         console.log(`⚠️ Overpayment: Received ${usdtAmount}, Expected ${expectedAmount}. Accepting.`);
//       }
//     }

//     return {
//       valid: true,
//       amount: usdtAmount,
//       fromAddress: fromAddress,
//       toAddress: WALLET_ADDRESS,
//       txHash: txHash,
//       blockNumber: parseInt(receipt.blockNumber, 16),
//       timestamp: parseInt(txData.result.timeStamp || (Date.now()/1000), 16) * 1000
//     };

//   } catch (error) {
//     console.error('Verification Error:', error);
//     return { valid: false, error: error.message };
//   }
// };
const verifyTransactionOnBscScan = async (txHash, expectedAmount = null) => {
  try {
    // IMPORTANT: Get this key from BscScan.com
    const API_KEY = process.env.ETHERSCAN_API_KEY || ; 
    
    // CRITICAL: Use BSC endpoint (Not Etherscan.io)
    const BSCSCAN_API_URL = "https://api.bscscan.com/api"; // <-- **CHANGE: Fixed missing /api**
    
    if (!API_KEY) {
        console.error("❌ [VERIFY FAIL] API key not configured in environment variables.");
        return { valid: false, error: "API key not configured" };
    }
    if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return { valid: false, error: "Invalid transaction hash format" };
    }

    console.log(`🔍 [BSCSCAN] Starting verification for TX: ${txHash}`);
    
    // --- STEP 1: GET TRANSACTION STATUS ---
    const txUrl = `${BSCSCAN_API_URL}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${API_KEY}`;
    
    console.log(`➡️ [BSCSCAN-1] Calling URL: ${txUrl}`); // <-- **LOG REQUEST URL**
    const txResponse = await fetch(txUrl);
    
    console.log(`⬅️ [BSCSCAN-1] Status: ${txResponse.status} ${txResponse.statusText}`); // <-- **LOG RESPONSE STATUS**

    if (!txResponse.ok) {
        // This handles 4xx/5xx HTTP errors, NOT transaction failures
        const errorText = await txResponse.text();
        console.error(`❌ [BSCSCAN-1 FAIL] HTTP Error. Response Body: ${errorText}`); // <-- **LOG RAW ERROR BODY**
        return { valid: false, error: `HTTP Error ${txResponse.status}: Could not connect or retrieve data.` };
    }

    const txData = await txResponse.json();
    
    if (!txData.result) {
      console.error("❌ [BSCSCAN-1 FAIL] No transaction result found in JSON response.");
      console.error("DEBUG DATA:", txData); // <-- **LOG BSCSCAN RESPONSE DATA**
      return { valid: false, error: "Transaction not found on BSC. Ensure you sent via BSC (BEP20)." };
    }
    
    console.log("✅ [BSCSCAN-1] Transaction details retrieved successfully.");

    // --- STEP 2: GET RECEIPT (Confirm success & Logs) ---
    const receiptUrl = `${BSCSCAN_API_URL}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${API_KEY}`;

    console.log(`➡️ [BSCSCAN-2] Calling URL: ${receiptUrl}`); // <-- **LOG REQUEST URL**
    const receiptResponse = await fetch(receiptUrl);

    console.log(`⬅️ [BSCSCAN-2] Status: ${receiptResponse.status} ${receiptResponse.statusText}`); // <-- **LOG RESPONSE STATUS**
    
    if (!receiptResponse.ok) {
        const errorText = await receiptResponse.text();
        console.error(`❌ [BSCSCAN-2 FAIL] HTTP Error. Response Body: ${errorText}`); // <-- **LOG RAW ERROR BODY**
        return { valid: false, error: `HTTP Error ${receiptResponse.status}: Could not connect or retrieve receipt.` };
    }

    const receiptData = await receiptResponse.json();
    const receipt = receiptData.result;

    if (!receipt || receipt.status !== "0x1") {
      console.error(`❌ [BSCSCAN-2 FAIL] Receipt status is not '0x1'. Status: ${receipt?.status || 'null'}`);
      return { valid: false, error: "Transaction failed or is pending" };
    }
    
    console.log("✅ [BSCSCAN-2] Receipt retrieved and confirmed as successful ('0x1').");

    // --- STEP 3: PARSE LOGS (The Security Check) ---
    // (Rest of the function remains the same as it correctly handles logs and amount checks)
    let usdtAmount = 0;
    let fromAddress = null;
    let foundMyTransfer = false;

    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === USDT_CONTRACT.toLowerCase()) {
          try {
            if (log.topics && log.topics.length === 3) {
              const toTopic = log.topics[2];
              const toAddr = "0x" + toTopic.slice(26); 
              
              if (toAddr.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
                const valueBigInt = BigInt(log.data);
                usdtAmount = Number(valueBigInt) / 1e18; 
                fromAddress = "0x" + log.topics[1].slice(26);
                foundMyTransfer = true;
                console.log(`✅ [LOGS] Found transfer of ${usdtAmount} USDT to wallet ${WALLET_ADDRESS}`);
                break; 
              }
            }
          } catch (e) { console.error("Log parse error", e); }
        }
      }
    }

    if (!foundMyTransfer) {
        console.error("❌ [LOGS FAIL] Valid transaction, but transfer log to YOUR wallet was not found.");
        return { valid: false, error: "Transaction is valid, but no USDT was sent to YOUR wallet." };
    }

    // --- STEP 4: CHECK AMOUNT (With Tolerance) ---
    if (expectedAmount !== null) {
      const tolerance = 0.2; 
      const diff = Math.abs(usdtAmount - expectedAmount);
      
      if (diff > tolerance) {
        if (usdtAmount < expectedAmount) {
             return { valid: false, error: `Underpayment. Received ${usdtAmount}, expected ${expectedAmount}.` };
        }
        console.log(`⚠️ Overpayment: Received ${usdtAmount}, Expected ${expectedAmount}. Accepting.`);
      }
    }
    
    console.log("🎉 [VERIFY SUCCESS] All checks passed.");

    return {
      valid: true,
      amount: usdtAmount,
      fromAddress: fromAddress,
      toAddress: WALLET_ADDRESS,
      txHash: txHash,
      blockNumber: parseInt(receipt.blockNumber, 16),
      timestamp: parseInt(txData.result.timeStamp || (Date.now()/1000), 16) * 1000
    };

  } catch (error) {
    console.error(`💥 [GLOBAL ERROR] Exception in verifyTransactionOnBscScan: ${error.message}`);
    // This catches network connection errors (like DNS/Firewall issues)
    return { valid: false, error: `Verification failed due to an internal error: ${error.message}` };
  }
};
/**
 * Helper: Extract gold amount from description or fallback to USDT amount
 */
const getGoldAmountFromTransaction = async (transaction) => {
  try {
    const description = transaction.description || "";
    const goldMatch = description.match(/(\d+)\s+Gold/i);
    if (goldMatch) return parseInt(goldMatch[1]);
    return Math.floor(transaction.amount); // Fallback
  } catch (error) {
    return Math.floor(transaction.amount);
  }
};

/**
 * Helper: Credit Gold to User's Main Balance
 */
const creditUserGold = async (userId, goldAmount) => {
  try {
    console.log(`💰 Crediting ${goldAmount} gold to user ${userId}`);
    const userBalance = await mainbalance.findOne({ userid: userId });
    
    if (userBalance) {
      userBalance.balance += goldAmount;
      await userBalance.save();
    } else {
      await mainbalance.create({ userid: userId, balance: goldAmount });
    }
    return true;
  } catch (error) {
    console.error("❌ Error crediting gold:", error);
    return false;
  }
};


// ==================== CONTROLLER FUNCTIONS ====================

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
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
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
      instructions: `Send exactly ${amount} USDT (BEP20) to the wallet address above. After sending, paste your transaction hash to confirm.`
    });

  } catch (error) {
    console.error("Web3 payment creation error:", error);
    res.status(500).json({ message: "Web3 payment creation failed", error: error.message });
  }
};

/**
 * @desc Check payment status by order ID
 * @route GET /api/payment/web3/status/:orderId
 */
exports.checkWeb3PaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ message: "Order ID is required" });

    const transaction = await PaymentTransaction.findOne({ orderId });

    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // Auto expire logic
    if (transaction.expiresAt && new Date() > transaction.expiresAt && transaction.status === 'waiting') {
      transaction.status = 'expired';
      await transaction.save();
    }

    res.status(200).json({
      orderId: transaction.orderId,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      expiresAt: transaction.expiresAt,
      txData: transaction.txData
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to check payment status", error: error.message });
  }
};

/**
 * @desc Verify transaction hash and confirm payment (THE MAIN FUNCTION)
 * @route POST /api/payment/web3/verify-tx
 */
exports.verifyTransactionHash = async (req, res) => {
  try {
    const { orderId, txHash } = req.body;

    if (!orderId || !txHash) {
      return res.status(400).json({ message: "Missing fields: orderId, txHash" });
    }

    const transaction = await PaymentTransaction.findOne({ orderId });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // Check Status
    if (transaction.status === 'confirmed') return res.status(200).json({ message: "Already confirmed", status: "confirmed" });
    if (transaction.status === 'expired') return res.status(400).json({ message: "Payment expired", status: "expired" });

    // EXECUTE VERIFICATION
    const verification = await verifyTransactionOnBscScan(txHash, transaction.amount);

    if (!verification.valid) {
      // Log the error but return a clean message to the user
      return res.status(400).json({ 
        message: verification.error, 
        status: "verification_failed",
        details: verification.error
      });
    }

    // SUCCESS: Update Database
    transaction.status = "confirmed";
    transaction.txData = {
      ...transaction.txData,
      amount: verification.amount,
      txHash: verification.txHash,
      fromAddress: verification.fromAddress,
      confirmedAt: new Date(),
      verifiedVia: "BSCSCAN_API"
    };
    await transaction.save();

    // CREDIT GOLD
    const goldAmount = await getGoldAmountFromTransaction(transaction);
    await creditUserGold(transaction.userId, goldAmount);

    res.status(200).json({
      message: "Payment verified successfully",
      status: "confirmed",
      orderId: transaction.orderId,
      amount: verification.amount
    });

  } catch (error) {
    console.error(`Verification exception for ${req.body.orderId}:`, error);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};

/**
 * @desc Get user's USDT balance from blockchain
 */
exports.getWalletBalance = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    if (!contract) return res.status(500).json({ message: "Web3 not initialized" });

    const balance = await contract.balanceOf(walletAddress);
    const balanceInUSDT = Number(ethers.formatUnits(balance, 18));

    res.status(200).json({
      walletAddress,
      balance: balanceInUSDT,
      currency: "USDT",
      network: "BSC"
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to get wallet balance", error: error.message });
  }
};

/**
 * @desc Cancel a Web3 payment
 */
exports.cancelWeb3Payment = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ message: "Order ID is required" });

    const transaction = await PaymentTransaction.findOne({ orderId });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    if (['confirmed', 'finished'].includes(transaction.status)) {
      return res.status(400).json({ message: "Cannot cancel confirmed transaction" });
    }

    transaction.status = 'cancelled';
    transaction.updatedAt = new Date();
    await transaction.save();

    res.status(200).json({ message: "Transaction cancelled", status: "cancelled" });

  } catch (error) {
    res.status(500).json({ message: "Cancellation failed", error: error.message });
  }
};

/**
 * @desc Process expired payments (Cron)
 */
exports.processExpiredPayments = async () => {
  try {
    const expiredPayments = await PaymentTransaction.find({
      status: "waiting",
      expiresAt: { $lt: new Date() }
    });

    let processedCount = 0;
    for (const payment of expiredPayments) {
      payment.status = "expired";
      await payment.save();
      processedCount++;
    }
    return { processed: processedCount };
  } catch (error) {
    console.error("Cron error:", error);
    return { processed: 0, error: error.message };
  }
};

/**
 * @desc Manual trigger for processing expired payments
 */
exports.manualProcessExpired = async (req, res) => {
  try {
    const result = await exports.processExpiredPayments();
    res.status(200).json({ message: "Expired payments processed", ...result });
  } catch (error) {
    res.status(500).json({ message: "Failed to process expired payments", error: error.message });
  }
};

// Needed for older router references to verifyPayment (maps to verifyTransactionHash)
exports.verifyPayment = exports.verifyTransactionHash;
exports.initializeWeb3Listener = async () => { return true; }; // Dummy function to prevent crash if called