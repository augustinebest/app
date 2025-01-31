const mongoose = require('../config/db');

const Schema = mongoose.Schema;
const scheduledEventsSchema = new Schema(
    {
        projectId: {
            type: String,
            ref: 'Project',
            alias: 'project',
            index: true,
        },
        monitors: [
            {
                monitorId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Monitor',
                    index: true,
                },
            },
        ],
        name: String,
        cancelled: {
            type: Boolean,
            default: false,
        },
        cancelledAt: Date,

        cancelledById: {
            type: String,
            ref: 'User',
            index: true,
        },
        slug: String,
        createdById: {
            type: String,
            ref: 'User',
            index: true,
        },

        deleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        deletedById: {
            type: String,
            ref: 'User',
            index: true,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        description: {
            type: String,
        },
        showEventOnStatusPage: {
            type: Boolean,
            default: false,
        },
        callScheduleOnEvent: {
            type: Boolean,
            default: false,
        },
        monitorDuringEvent: {
            type: Boolean,
            default: false,
        },
        recurring: {
            type: Boolean,
            default: false,
        },
        interval: {
            type: String,
            default: null,
        },
        alertSubscriber: {
            type: Boolean,
            default: false,
        },
        resolved: { type: Boolean, default: false },
        resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        resolvedAt: Date,
    },
    { timestamps: true }
);

module.exports = mongoose.model('ScheduledEvent', scheduledEventsSchema);
