module.exports = {
    findOneBy: async function({ query }) {
        try {
            if (!query) {
                query = {};
            }
            if (!query.deleted)
                query.$or = [
                    { deleted: false },
                    { deleted: { $exists: false } },
                ];

            const project = await projectCollection.findOne(query);
            return project;
        } catch (error) {
            ErrorService.log('projectService.findOneBy', error);
            throw error;
        }
    },
    findBy: async function({ query, limit, skip }) {
        try {
            if (!skip) skip = 0;

            if (!limit) limit = 0;

            if (typeof skip === 'string') skip = parseInt(skip);

            if (typeof limit === 'string') limit = parseInt(limit);

            if (!query) query = {};

            if (!query.deleted)
                query.$or = [
                    { deleted: false },
                    { deleted: { $exists: false } },
                ];

            const projects = await projectCollection
                .find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .toArray();
            return projects;
        } catch (error) {
            ErrorService.log('projectService.findBy', error);
            throw error;
        }
    },
};

const projectCollection = global.db.collection('projects');
const ErrorService = require('./errorService');
