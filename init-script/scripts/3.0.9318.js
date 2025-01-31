const { find, update } = require('../util/db');

const subscriberCollection = 'subscribers';

async function run() {
    const subscribers = await find(subscriberCollection, {
        notificationType: { $exists: false },
    });

    for (let i = 0; i < subscribers.length; i++) {
        const subscriber = subscribers[i];
        let notificationType = null;
        if (subscriber.statusPageId) {
            notificationType = {
                announcement: false,
                incident: false,
                scheduledEvent: false,
            };
        }
        await update(
            subscriberCollection,
            { _id: subscriber._id },
            {
                notificationType,
            }
        );
    }
}

module.exports = run;
