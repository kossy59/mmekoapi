const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const globalSettingsSchema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'main_config'
    },
    isMaintenance: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
