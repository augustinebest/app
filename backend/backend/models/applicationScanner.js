const mongoose = require('../config/db');

const Schema = mongoose.Schema;
const applicationScannerSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    applicationScannerKey: { type: String },
    applicationScannerName: { type: String },
    version: { type: String },
    lastAlive: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    applicationScannerImage: { type: String },
});

module.exports = mongoose.model('applicationScanner', applicationScannerSchema);
