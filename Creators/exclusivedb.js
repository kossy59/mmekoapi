const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contentfile = Schema({
  contentfilelink: {
    type: String,
    required: false,
  },

  contentfilepublicid: {
    type: String,
    required: false,
  },
});

const thumbnailfile = Schema({
  thumbnaillink: {
    type: String,
    required: false,
  },

  thumbnailpublicid: {
    type: String,
    required: false,
  },
});

const markertdata = new Schema(
  {
    userid: {
      type: String,
      required: true,
    },

    content_type: {
      type: String,
      required: true,
    },

    contentname: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },

    contentfile: contentfile,
    thumbnailfile: thumbnailfile,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exclusive", markertdata);
