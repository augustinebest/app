const mongoose = require('../config/db');

const Schema = mongoose.Schema;
const certificateSchema = new Schema(
    {
        id: Schema.Types.Mixed,
        privateKeyPem: Schema.Types.Mixed,
        privateKeyJwk: Schema.Types.Mixed,
        cert: Schema.Types.Mixed,
        chain: Schema.Types.Mixed,
        privKey: Schema.Types.Mixed,
        subject: Schema.Types.Mixed,
        altnames: Schema.Types.Mixed,
        issuedAt: Schema.Types.Mixed,
        expiresAt: Schema.Types.Mixed,
        deleted: { type: Boolean, default: false },
        deletedAt: Date,
    },
    { timestamps: true }
);
module.exports = mongoose.model('Certificate', certificateSchema);
