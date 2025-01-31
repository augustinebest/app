const mongoose = require('../config/db');

const Schema = mongoose.Schema;
const automatedScriptSchema = new Schema(
    {
        name: String,
        script: String,
        scriptType: String,
        slug: String,
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
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
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        successEvent: [
            {
                automatedScript: {
                    type: Schema.Types.ObjectId,
                    ref: 'AutomationSript',
                    index: true,
                },
                callSchedule: {
                    type: Schema.Types.ObjectId,
                    ref: 'Schedule',
                    index: true,
                },
            },
        ],
        failureEvent: [
            {
                automatedScript: {
                    type: Schema.Types.ObjectId,
                    ref: 'AutomationSript',
                    index: true,
                },
                callSchedule: {
                    type: Schema.Types.ObjectId,
                    ref: 'Schedule',
                    index: true,
                },
            },
        ],
    },
    { timestamps: true }
);
module.exports = mongoose.model('AutomationSript', automatedScriptSchema);
