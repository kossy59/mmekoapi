const mongoose = require("mongoose");
const Scheme = mongoose.Schema;

const markertdata = new Scheme(
  {
    userid: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: false,
    },
    end_date: {
      type: String,
      required: false,
    },
    suspend: {
      type: Boolean,
      required: false,
    },
    seen: {
      type: Boolean,
      required: false,
    },
    delete: {
      type: Boolean,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    message: { 
      type: String,
      required: true
   },
  },
  { timestamps: true }
);

module.exports = mongoose.model("admindb", markertdata);
