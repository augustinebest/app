const { find, update } = require('../util/db');
const getSlug = require('../util/getSlug');

const scheduledCollection = 'scheduledevents';

async function run() {
    const items = await find(scheduledCollection, {
        $or: [
            { slug: { $exists: false } },
            { slug: { $regex: /[&*+~.,\\/()|'"!:@]+/g } },
        ],
    });
    for (let i = 0; i < items.length; i++) {
        const { name } = items[i];
        items[i].slug = getSlug(name);
        await update(
            scheduledCollection,
            { _id: items[i]._id },
            { slug: items[i].slug }
        );
    }
    return `Script ran for ${items.length} status pages.`;
}

module.exports = run;
