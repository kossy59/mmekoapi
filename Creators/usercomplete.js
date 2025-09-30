const mongoose = require("mongoose");
const Scheme = mongoose.Schema;

const markertdata = new Scheme(
  {
    useraccountId: {
      type: String,
      required: true,
    },

    interestedIn: {
      type: String,
      required: false,
    },

    photoLink: {
      type: String,
      required: false,
    },

    photoID: {
      type: String,
      required: false,
    },

    relationshipType: {
      type: String,
      required: false,
    },

    details: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserInfo", markertdata);
