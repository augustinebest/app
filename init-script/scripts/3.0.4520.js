const { find, update, removeField } = require('../util/db');

const scheduledEventNoteCollection = 'scheduledeventnotes';

async function run() {
    const scheduledEventNotes = await find(scheduledEventNoteCollection, {
        incident_state: { $type: 'string' },
    });

    scheduledEventNotes.forEach(async eventNote => {
        const event_state = eventNote.incident_state;

        await update(
            scheduledEventNoteCollection,
            { _id: eventNote._id },
            { event_state }
        );

        await removeField(
            scheduledEventNoteCollection,
            { _id: eventNote._id },
            'incident_state'
        );
    });
}

module.exports = run;
