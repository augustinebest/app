const { find, update } = require('../util/db');

const SUBSCRIBER_COLLECTION = 'subscribers';
async function run() {
    // get webhook subscribers without webhookMethod feild
    const subscribersWithoutWebhookMethod = await find(SUBSCRIBER_COLLECTION, {
        alertVia: 'webhook',
        webhookMethod: { $exists: false },
    });
    // update each subscriber by adding the field with a default value
    subscribersWithoutWebhookMethod.forEach(subscriber => {
        update(
            SUBSCRIBER_COLLECTION,
            { _id: subscriber._id },
            { webhookMethod: 'post' }
        );
    });
}

module.exports = run;
