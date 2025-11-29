const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const referralSchema = new Schema(
    {
        referrerId: {
            type: String,
            required: true,
            index: true,
        },
        refereeId: {
            type: String,
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'paid'],
            default: 'completed',
        },
        rewardAmount: {
            type: Number,
            default: 0,
        },
        rewardType: {
            type: String,
            enum: ['coins', 'balance', 'vip_days', 'gold'],
            default: 'coins',
        },
    },
    { timestamps: true }
);

// Index for efficient querying
referralSchema.index({ referrerId: 1, createdAt: -1 });

module.exports = mongoose.model("Referral", referralSchema);
