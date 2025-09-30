const mongoose = require("mongoose");
const Scheme = mongoose.Schema;

const markertdata = new Scheme(
  {
    creatorid: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: false,
    },

    time: {
      type: String,
      required: false,
    },

    place: {
      type: String,
      required: true,
    },

    userid: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      require: false,
      default: "pending",
    },

    date: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.creator("Booking", markertdata);
