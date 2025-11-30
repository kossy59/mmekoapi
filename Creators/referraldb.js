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
        // Milestone tracking: 7-day challenge (120 min/day for 7 days = 25 gold bonus)
        milestoneCompleted: {
            type: Boolean,
            default: false,
        },
        milestoneFailed: {
            type: Boolean,
            default: false,
        },
        milestoneCompletedAt: {
            type: Date,
            required: false,
        },
        milestoneReward: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Index for efficient querying
referralSchema.index({ referrerId: 1, createdAt: -1 });

module.exports = mongoose.model("Referral", referralSchema);
