# Web3 Payment System Setup Guide

## 🚀 Quick Setup

### 1. Environment Variables
Add these to your `.env` file:

```env
# Web3 Payment Configuration
RPC_URL=https://bsc-dataseed.binance.org/
WALLET_ADDRESS=0xYourMainWalletAddress
USDT_CONTRACT=0x55d398326f99059fF775485246999027B3197955
```

### 2. Dependencies
You already have the required dependencies:
- ✅ `ethers` (v6.15.0)
- ✅ `mongoose` (v8.17.0)
- ✅ `dotenv` (v17.2.1)

### 3. API Endpoints

#### Create Web3 Payment
```bash
POST /web3/create
{
  "amount": 10.50,
  "userId": "user_id_here",
  "order_description": "Gold Pack Purchase"
}
```

#### Check Payment Status
```bash
GET /web3/status/:orderId
```

#### Get Wallet Balance
```bash
GET /web3/balance/:walletAddress
```

#### Start/Stop Listening
```bash
POST /web3/start-listening
POST /web3/stop-listening
```

#### Manual Payment Verification
```bash
POST /web3/verify-payment
{
  "orderId": "web3_user_id_timestamp",
  "fromAddress": "0xSenderWalletAddress"
}
```

## 🔧 How It Works

1. **User creates payment** → Gets wallet address and amount to send
2. **User sends USDT** → To your configured wallet address
3. **System detects transfer** → Automatically via blockchain events
4. **Balance updated** → User's gold balance is credited
5. **Payment confirmed** → Transaction status updated

## 🛡️ Security Features

- **Automatic detection** of USDT transfers to your wallet
- **Amount matching** to prevent wrong payments
- **User balance crediting** only after confirmation
- **Transaction logging** for audit trails

## 📱 Frontend Integration

Update your buy-gold page to use Web3 payments:

```javascript
// Replace the existing payment call with:
const createWeb3Payment = async (amount, userId) => {
  const response = await fetch('/web3/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      userId,
      order_description: 'Gold Pack Purchase'
    })
  });
  
  const data = await response.json();
  
  if (data.walletAddress) {
    // Show user the wallet address and amount to send
    alert(`Send ${amount} USDT to: ${data.walletAddress}`);
  }
};
```

## 🔍 Monitoring

The system automatically:
- ✅ Listens for USDT transfers
- ✅ Matches amounts to pending orders
- ✅ Credits user balances
- ✅ Updates transaction status
- ✅ Logs all activities

## 🚨 Important Notes

1. **Set your wallet address** in the environment variables
2. **Test on BSC testnet** first before going live
3. **Monitor the logs** for payment confirmations
4. **Backup your wallet** private keys securely
5. **Use HTTPS** in production for security

## 🎯 Benefits

- **No third-party fees** (except gas)
- **Instant confirmation** via blockchain
- **Automatic processing** - no manual intervention
- **Transparent** - all transactions on blockchain
- **Secure** - decentralized and immutable
