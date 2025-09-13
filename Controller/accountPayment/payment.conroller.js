const axios = require("axios");
const mongoose = require("mongoose");

const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_API_URL || "https://api-sandbox.nowpayments.io/v1/invoice-payment";
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY; // Store in .env file

// Create a payment invoice using NOWPayments
exports.createCryptoPayment = async (req, res) => {
  try {
    const { userId, amount, pay_currency = "usdtbep20", order_description, customer_email } = req.body;

    // Validate required fields
    if (!userId || !amount || !pay_currency) {
      return res.status(400).json({ message: "Missing required fields: userId, amount, or pay_currency" });
    }

    // Generate a unique invoice ID (can be a MongoDB ObjectId or custom)
    const invoiceId = new mongoose.Types.ObjectId().toString();

    // Prepare payload for NOWPayments invoice-payment API
    const payload = {
      iid: invoiceId,
      pay_currency: pay_currency.toLowerCase(), // e.g., "usdtbep20"
      amount: parseFloat(amount).toFixed(2), // Ensure proper formatting
      order_description: order_description || "Gold Pack Purchase",
      customer_email: customer_email || null,
      payout_currency: "usdtbep20", // Merchant payout currency
      case: "success", // For testing, use "success" case
    };

    // Make request to NOWPayments API
    const response = await axios.post(`${NOWPAYMENTS_API_URL}/invoice-payment`, payload, {
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
    });

    const { invoice_url, payment_id, pay_address, payin_extra_id } = response.data;

    // Optionally, save payment details to your database for tracking
    const paymentRecord = {
      userId,
      invoiceId,
      paymentId: payment_id,
      payAddress: pay_address,
      payinExtraId: payin_extra_id || null,
      amount,
      currency: pay_currency,
      status: "waiting", // Initial status
      createdAt: new Date(),
    };

    // Assuming a new Payment model is created (see payment.js below)
    const Payment = mongoose.model("Payment");
    await Payment.create(paymentRecord);

    return res.status(201).json({
      message: "Payment invoice created",
      checkoutUrl: invoice_url,
      paymentId: payment_id,
    });
  } catch (err) {
    console.error("Error creating payment:", err.response?.data || err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Optional: Check payment status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const response = await axios.get(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
      },
    });

    const { payment_status } = response.data;

    // Update payment status in your database if needed
    const Payment = mongoose.model("Payment");
    await Payment.findOneAndUpdate(
      { paymentId },
      { status: payment_status },
      { new: true }
    );

    return res.status(200).json({ status: payment_status });
  } catch (err) {
    console.error("Check payment status error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Server error" });
  }
};