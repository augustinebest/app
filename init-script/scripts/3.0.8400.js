const { find, update } = require('../util/db');
const getSlug = require('../util/getSlug');
const monitorCollection = 'monitors';

async function run() {
    const monitors = await find(monitorCollection, {
        $or: [
            { slug: { $exists: false } },
            { slug: { $regex: /[&*+~.,\\/()|'"!:@]+/g } },
        ],
    });
    for (let i = 0; i < monitors.length; i++) {
        const { name } = monitors[i];
        monitors[i].slug = getSlug(name);
        await update(
            monitorCollection,
            { _id: monitors[i]._id },
            { slug: monitors[i].slug }
        );
    }
    return `Script ran for ${monitors.length} monitors.`;
}
module.exports = run;
