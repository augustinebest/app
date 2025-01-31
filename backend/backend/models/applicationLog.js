const mongoose = require('../config/db');

const Schema = mongoose.Schema;
const applicationLogSchema = new Schema({
    componentId: {
        type: Schema.Types.ObjectId,
        ref: 'Component',
        alias: 'component',
        index: true,
    }, //which component this application log belongs to.
    name: String,
    slug: { type: String, index: true },
    key: String,
    resourceCategory: {
        type: Schema.Types.ObjectId,
        ref: 'ResourceCategory',
        index: true,
    },
    showQuickStart: {
        type: Boolean,
        default: true,
    },
    createdById: { type: String, ref: 'User', index: true }, //userId.
    createdAt: {
        type: Date,
        default: Date.now,
    },
    deleted: { type: Boolean, default: false },

    deletedAt: {
        type: Date,
    },

    deletedById: { type: String, ref: 'User', index: true },
});

applicationLogSchema.virtual('component', {
    localField: '_id',
    foreignField: 'componentId',
    ref: 'Component',
    justOne: true,
});

module.exports = mongoose.model('ApplicationLog', applicationLogSchema);
