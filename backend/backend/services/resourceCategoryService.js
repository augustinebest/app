module.exports = {
    create: async function(data) {
        const existingResourceCategory = await this.countBy({
            name: data.name,
            projectId: data.projectId,
        });
        if (existingResourceCategory && existingResourceCategory > 0) {
            const error = new Error(
                'A resource category with that name already exists.'
            );
            error.code = 400;
            throw error;
        }
        let resourceCategory = new ResourceCategoryModel();
        resourceCategory.projectId = data.projectId;
        resourceCategory.createdById = data.createdById;
        resourceCategory.name = data.name;
        resourceCategory = await resourceCategory.save();
        return resourceCategory;
    },

    deleteBy: async function(query, userId) {
        const resourceCategory = await ResourceCategoryModel.findOneAndUpdate(
            query,
            {
                $set: {
                    deleted: true,
                    deletedAt: Date.now(),
                    deletedById: userId,
                },
            },
            { new: true }
        );

        await Promise.all([
            MonitorModel.updateMany(
                { resourceCategory: query._id },
                {
                    $set: {
                        resourceCategory: null,
                    },
                }
            ),
            ApplicationLogModel.updateMany(
                { resourceCategory: query._id },
                {
                    $set: {
                        resourceCategory: null,
                    },
                }
            ),
            ErrorTrackerModel.updateMany(
                { resourceCategory: query._id },
                {
                    $set: {
                        resourceCategory: null,
                    },
                }
            ),
            ApplicationSecurityModel.updateMany(
                { resourceCategory: query._id },
                {
                    $set: {
                        resourceCategory: null,
                    },
                }
            ),
            ContainerSecurityModel.updateMany(
                { resourceCategory: query._id },
                {
                    $set: {
                        resourceCategory: null,
                    },
                }
            ),
        ]);

        return resourceCategory;
    },

    findBy: async function({ query, limit, skip, select, populate }) {
        if (!skip) skip = 0;

        if (!limit) limit = 0;

        if (typeof skip === 'string') {
            skip = parseInt(skip);
        }

        if (typeof limit === 'string') {
            limit = parseInt(limit);
        }

        if (!query) {
            query = {};
        }

        query.deleted = false;
        let resourceCategoriesQuery = ResourceCategoryModel.find(query)
            .lean()
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });

        resourceCategoriesQuery = handleSelect(select, resourceCategoriesQuery);
        resourceCategoriesQuery = handlePopulate(
            populate,
            resourceCategoriesQuery
        );

        let resourceCategories = await resourceCategoriesQuery;

        resourceCategories = resourceCategories.map(resourceCategory => ({
            name: resourceCategory.name,
            _id: resourceCategory._id,
            createdAt: resourceCategory.createdAt,
        }));
        return resourceCategories;
    },

    updateOneBy: async function(query, data) {
        const existingResourceCategory = await this.countBy({
            name: data.name,
            projectId: data.projectId,
            _id: { $not: { $eq: data._id } },
        });
        if (existingResourceCategory && existingResourceCategory > 0) {
            const error = new Error(
                'A resource category with that name already exists.'
            );
            error.code = 400;
            throw error;
        }
        if (!query) {
            query = {};
        }
        if (!query.deleted) query.deleted = false;
        const resourceCategory = await ResourceCategoryModel.findOneAndUpdate(
            query,
            {
                $set: data,
            },
            {
                new: true,
            }
        );
        return resourceCategory;
    },

    updateBy: async function(query, data) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        let updatedData = await ResourceCategoryModel.updateMany(query, {
            $set: data,
        });
        const select = 'projectId name createdById createdAt';
        updatedData = await this.findBy({ query, select });
        return updatedData;
    },

    countBy: async function(query) {
        if (!query) {
            query = {};
        }

        query.deleted = false;
        const count = await ResourceCategoryModel.countDocuments(query);
        return count;
    },
    hardDeleteBy: async function(query) {
        await ResourceCategoryModel.deleteMany(query);
        return 'Resource Categories(s) removed successfully!';
    },
};

const ResourceCategoryModel = require('../models/resourceCategory');
const MonitorModel = require('../models/monitor');
const ApplicationLogModel = require('../models/applicationLog');
const ErrorTrackerModel = require('../models/errorTracker');
const ApplicationSecurityModel = require('../models/applicationSecurity');
const ContainerSecurityModel = require('../models/containerSecurity');
const handleSelect = require('../utils/select');
const handlePopulate = require('../utils/populate');
