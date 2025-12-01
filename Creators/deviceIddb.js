const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const deviceIdDB = new Schema(
    {
        deviceId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("DeviceId", deviceIdDB);