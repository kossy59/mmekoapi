const axios = require("axios");
const dotenv = require("dotenv");
const PaymentTransaction = require("../../Creators/PaymentTransaction");
dotenv.config();

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const BASE_URL = "https://api-sandbox.nowpayments.io/v1";

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
      ipn_callback_url: "https://hong-unhomologous-doyle.ngrok-free.dev/payment/webhook",
      success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
    };

    console.log("Creating invoice with payload:", payload);

    // ✅ Create an invoice (this returns checkout link)
    const response = await axios.post(`${BASE_URL}/invoice`, payload, {
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
    });
    
    console.log("NOWPayments invoice response:", response.data);

    // Save transaction
    const newTx = new PaymentTransaction({
      userId,
      orderId,
      amount,
      payCurrency: pay_currency,
      order_description,
      invoiceUrl: response.data.invoice_url,
      txData: response.data,
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
 * @desc Handle webhook callbacks from NOWPayments
 * @route POST /api/payment/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    const { payment_status, order_id, pay_address, price_amount } = req.body;
    console.log("Webhook received:", req.body);

    const transaction = await PaymentTransaction.findOne({ orderId: order_id });
    if (!transaction) {
      console.log("Transaction not found for order:", order_id);
      return res.status(404).send("Transaction not found");
    }

    // Update payment status
    transaction.status = payment_status;
    transaction.txData = req.body;
    await transaction.save();

    // Optional: perform logic when confirmed
    if (payment_status === "confirmed" || payment_status === "finished") {
      console.log(`✅ Payment confirmed for order ${order_id}`);
      // TODO: Add logic to credit user's gold balance here
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Webhook processing failed");
  }
};
