const { find, update } = require('../util/db');
const getSlug = require('../util/getSlug');
const schedulesCollection = 'schedules';

async function run() {
    const schedules = await find(schedulesCollection, {
        $or: [
            { slug: { $exists: false } },
            { slug: { $regex: /[&*+~.,\\/()|'"!:@]+/g } },
        ],
    });
    for (let i = 0; i < schedules.length; i++) {
        const { name } = schedules[i];
        schedules[i].slug = getSlug(name);
        await update(
            schedulesCollection,
            { _id: schedules[i]._id },
            { slug: schedules[i].slug }
        );
    }
    return `Script ran for ${schedules.length} schedules.`;
}
module.exports = run;
