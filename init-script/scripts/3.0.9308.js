const { find, update } = require('../util/db');
const { ObjectId } = require('mongodb');

const incidentCollection = 'incidents';

async function run() {
    const incidents = await find(incidentCollection, {
        monitors: { $exists: false },
        notifications: { $exists: false },
    });

    for (const incident of incidents) {
        const data = {
            notifications: [],
        };

        if (incident.monitorId) {
            const monitors = [{ monitorId: ObjectId(incident.monitorId) }];
            data.monitors = monitors;
        }
        if (incident.notificationId) {
            const notifications = [
                { notificationId: ObjectId(incident.notificationId) },
            ];
            data.notifications = notifications;
        }

        await update(incidentCollection, { _id: incident._id }, data);
    }

    return `Script ran for ${incidents.length} incidents`;
}

module.exports = run;
