const { find, update } = require('../util/db');
const getSlug = require('../util/getSlug');
const errortrackerCollection = 'errortrackers';

async function run() {
    const errorTrackers = await find(errortrackerCollection, {
        $or: [
            { slug: { $exists: false } },
            { slug: { $regex: /[&*+~.,\\/()|'"!:@]+/g } },
        ],
    });
    for (let i = 0; i < errorTrackers.length; i++) {
        const { name } = errorTrackers[i];
        errorTrackers[i].slug = getSlug(name);
        await update(
            errortrackerCollection,
            { _id: errorTrackers[i]._id },
            { slug: errorTrackers[i].slug }
        );
    }
    return `Script ran for ${errorTrackers.length} errorTrackers.`;
}
module.exports = run;
