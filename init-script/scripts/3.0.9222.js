const { find, update, findOne } = require('../util/db');

const scheduledEventNoteCollection = 'scheduledeventnotes';
const scheduledEventCollection = 'scheduledevents';

// run this script once
async function run() {
    const scheduledEventNotes = await find(scheduledEventNoteCollection, {
        content: 'THIS SCHEDULED EVENT HAS BEEN CREATED',
        event_state: 'Created',
        deleted: false,
    });

    for (const note of scheduledEventNotes) {
        const scheduledEvent = await findOne(scheduledEventCollection, {
            _id: note.scheduledEventId,
        });

        if (scheduledEvent) {
            await update(
                scheduledEventNoteCollection,
                { _id: note._id },
                { content: scheduledEvent.description }
            );
        }
    }

    return `Script ran for ${scheduledEventNotes.length} scheduled event notes`;
}

module.exports = run;
