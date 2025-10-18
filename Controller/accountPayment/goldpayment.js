const axios = require("axios");
const dotenv = require("dotenv");
const PaymentTransaction = require("../../Creators/PaymentTransaction");
dotenv.config();
const userdb = require("../../Creators/userdb");

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const BASE_URL = "https://api-sandbox.nowpayments.io/v1";

/**
 * Create Payment — called when user starts a transaction.
 */
exports.createPayment = async (req, res) => {
  try {
    const { amount, userId, pay_currency, order_description } = req.body;

    if (!amount || !userId || !pay_currency) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const orderId = `${userId}_${Date.now()}`;
    const payload = {
      price_amount: Number(amount),
      price_currency: "usd",
      pay_currency,
      order_id: orderId,
      order_description: order_description || "Gold Pack Purchase",
      ipn_callback_url: "https://mmekoapi.onrender.com/payment/webhook",
      success_url: `${process.env.NEXT_PUBLIC_URL}/buy-gold/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/buy-gold/cancel`,
    };

    console.log("Creating invoice with payload:", payload);

    // ✅ Create invoice
    const response = await axios.post(`${BASE_URL}/invoice`, payload, {
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("NOWPayments invoice response:", response.data);

    // Save transaction with 'waiting' status
    const newTx = new PaymentTransaction({
      userId,
      orderId,
      amount,
      payCurrency: pay_currency,
      order_description,
      invoiceUrl: response.data.invoice_url,
      txData: response.data,
      status: "waiting",
      isCredited: false,
      paymentId: response.data.id,
    });

    await newTx.save();

    res.status(200).json({
      checkoutUrl: response.data.invoice_url,
      paymentId: response.data.id,
      message: "Payment link created",
    });
  } catch (error) {
    console.error("NOWPayments create error:", error.response?.data || error.message);
    res.status(500).json({
      message: "Payment creation failed",
      error: error.response?.data || error.message,
    });
  }
};

/**
 * Handle Webhook — used by NOWPayments to notify status change.
 */
exports.handleWebhook = async (req, res) => {
  try {
    console.log("Webhook received:", req.body);
    const { payment_status, order_id, price_amount } = req.body || {};

    if (!order_id || !payment_status) {
      return res.status(400).send("Invalid webhook payload");
    }

    // 🔍 Find the transaction in DB
    const transaction = await PaymentTransaction.findOne({ orderId: order_id });
    if (!transaction) return res.status(404).send("Transaction not found");

    // 🧠 Define your gold mapping table (price_amount → gold)
    const priceToGold = {
      79.99: 1000 + 37,
      62.99: 750 + 32,
      49.99: 550 + 21,
      39.99: 400 + 10,
      20.99: 200 + 5,
      10.99: 100,
      6.99: 50,
    };

    // 🧩 Round to 2 decimals to match object keys
    const roundedPrice = parseFloat(price_amount).toFixed(2);

    // 🪙 Find corresponding gold value
    const goldAmount = priceToGold[roundedPrice] || 0;

    transaction.status = payment_status;
    transaction.txData = req.body;

    // ✅ Only credit if confirmed/finished and not already credited
    if (
      (payment_status === "confirmed" || payment_status === "finished") &&
      !transaction.isCredited
    ) {
      const user = await userdb.findById(transaction.userId);
      if (!user) return res.status(404).send("User not found");

      user.balance = (user.balance || 0) + goldAmount;
      await user.save();

      transaction.isCredited = true;
      transaction.status = "completed";
      console.log(
        `💰 Credited ${goldAmount} gold to user ${user._id} for $${roundedPrice}`
      );
    }

    await transaction.save();
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.status(500).send("Webhook processing failed");
  }
};


/**
 * Verify Latest Payment — used by frontend success page (no NP_id in URL)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId)
      return res.status(400).json({ success: false, message: "Missing userId" });

    // 🔍 Find the latest transaction for this user
    const transaction = await PaymentTransaction.findOne({ userId }).sort({ createdAt: -1 });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "No transaction found" });
    }

    // ✅ Always trigger webhook with confirmed status
    const payload = {
      payment_status: "confirmed",
      order_id: transaction.orderId,
      price_amount: transaction.amount,
    };

    console.log("🚀 Triggering webhook with payload:", payload);

    // POST to your webhook endpoint
    await axios.post(
      "https://mmekoapi.onrender.com/payment/webhook",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ Webhook triggered successfully");

    // Re-fetch transaction to get updated status after webhook runs
    const updatedTx = await PaymentTransaction.findById(transaction._id);

    res.status(200).json({
      success: true,
      message:
        updatedTx.status === "completed"
          ? "Payment processed successfully"
          : "Waiting for confirmation",
      status: updatedTx.status,
      orderId: updatedTx.orderId,
    });
  } catch (error) {
    console.error("❌ Verify Payment error:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};


exports.updateGoldBalance = async (userId, amount) => {
  try {
    const user = await userdb.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const goldAmount = Number(amount);
    if (isNaN(goldAmount) || goldAmount < 0) {
      throw new Error("Invalid amount");
    }

    user.balance = (user.balance || 0) + goldAmount;
    await user.save();

    console.log(`💰 Credited ${goldAmount} gold to user ${user._id}`);
    return { message: `Successfully credited ${goldAmount} gold to user ${userId}`, balance: user.balance };
  } catch (error) {
    console.error("❌ Update gold balance error:", error.message);
    throw error;
  }
};
