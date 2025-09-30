const mongoose = require("mongoose");
const Scheme = mongoose.Schema;


const markertdata = new Scheme(
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
  },
  { timestamps: true }
);

// Virtuals for likeCount and likedBy can be handled in aggregation
module.exports = mongoose.creator("Post", markertdata);
