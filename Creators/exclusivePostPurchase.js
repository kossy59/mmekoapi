const mongoose = require("mongoose");
const Scheme = mongoose.Schema;

const exclusivePostPurchaseSchema = new Scheme(
  {
    userid: {
      type: String,
      required: true,
    },
    postid: {
      type: String,
      required: true,
    },
    creator_userid: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    purchasedAt: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Create index to prevent duplicate purchases
exclusivePostPurchaseSchema.index({ userid: 1, postid: 1 }, { unique: true });

module.exports = mongoose.model("ExclusivePostPurchase", exclusivePostPurchaseSchema);

