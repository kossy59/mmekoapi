const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    residentialAddress: { type: String, required: true },
    idPhoto: { type: String, required: true },
    selfieWithId: { type: String, required: true },
    Model_Application_status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    Model_Application: { type: Boolean, required: false, default: false },
    exclusive_verify: { type: Boolean, required: false, default: false },
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDB",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("application_model", userSchema);
