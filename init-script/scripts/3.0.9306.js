const { updateMany } = require('../util/db');

const statusPageCollection = 'statuspages';

async function run() {
    await updateMany(
        statusPageCollection,
        { layout: { $exists: false } },
        {
            layout: {
                visible: [
                    { name: 'Header', key: 'header' },
                    {
                        name: 'Active Announcement',
                        key: 'anouncement',
                    },
                    {
                        name: 'Ongoing Scheduled Events',
                        key: 'ongoingSchedule',
                    },
                    { name: 'Overall Status of Resources', key: 'resources' },
                    { name: 'Resource List', key: 'services' },
                    { name: 'Incidents List', key: 'incidents' },
                    {
                        name: 'Past Announcements List',
                        key: 'AnnouncementLogs',
                    },
                    {
                        name: 'Future Scheduled Events',
                        key: 'maintenance',
                    },
                    { name: 'Footer', key: 'footer' },
                ],
                invisible: [
                    { name: 'Scheduled Events Completed', key: 'pastEvents' },
                ],
            },
        }
    );
    return `Script completed`;
}

module.exports = run;
