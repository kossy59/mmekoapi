const mongoose = require("mongoose");
const Scheme = mongoose.Schema;

const exclusivePostSchema = new Scheme(
  {
    userid: {
      type: String,
      required: true,
    },
    postfilelink: {
      type: String,
      required: false,
    },
    postfilepublicid: {
      type: String,
      required: false,
    },
    posttime: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: false,
    },
    posttype: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExclusivePost", exclusivePostSchema);

