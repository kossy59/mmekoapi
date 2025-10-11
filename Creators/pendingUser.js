const mongoose = require("mongoose");
const Scheme = mongoose.Schema;

const pendingUser = new Scheme(
  {
    firstname: {
      type: String,
      required: true,
    },

    lastname: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      required: true,
    },

    nickname: {
      type: String,
      required: false,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    emailconfirm: {
      type: String,
      required: true,
    },

    active: {
      type: Boolean,
      required: true,
      default: false,
    },

    country: {
      type: String,
      required: true,
    },

    refreshtoken: {
      type: String,
      required: false,
    },

    age: {
      type: String,
      required: true,
    },

    admin: {
      type: Boolean,
      required: true,
    },

    passcode: {
      type: String,
      required: false,
    },

    balance: {
      type: String,
      required: false,
    },
    withdrawbalance: {
      type: String,
      required: false,
    },
    creator_verified: {
      type: Boolean,
      required: false,
      default: false,
    },
    dob: {
      type: String,
      required: false,
    },
    creator_portfolio: {
      type: Boolean,
      required: false,
      default: false,
    },
    creator_portfoliio_Id: {
      type: String,
      required: false,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingUser", pendingUser);
