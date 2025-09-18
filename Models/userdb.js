const mongoose = require("mongoose");
const Scheme = mongoose.Schema;

const markertdata = new Scheme(
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

    // email: {
    //   type: String,
    //   required: true,
    // },

    password: {
      type: String,
      required: true,
    },

    // emailconfirm: {
    //   type: String,
    //   required: true,
    // },

    secretPhrase: {
      type: [String], // Array of 12 words (stored as plain text for recovery)
      required: true
    },
    
    secretPhraseHash: {
      type: String,
      required: false // No longer needed
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
    
    accessToken: {
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
    exclusive_verify: {
      type: Boolean,
      required: false,
      default: false,
    },
    dob: {
      type: String,
      required: false,
    },
    isModel: {
      type: Boolean,
      required: false,
      default: false,
    },
    modelId: {
      type: String,
      required: false,
      default: "",
    },
    followers: {
      type: [String],
      required: false,
      default: [],
    },
    following: {
      type: [String],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserDB", markertdata);
