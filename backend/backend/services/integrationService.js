module.exports = {
    findBy: async function({ query, skip, limit, select, populate }) {
        if (!skip) skip = 0;

        if (!limit) limit = 0;

        if (typeof skip === 'string') skip = parseInt(skip);

        if (typeof limit === 'string') limit = parseInt(limit);

        if (!query) query = {};

        if (!query.deleted) query.deleted = false;
        let integrationQuery = IntegrationModel.find(query)
            .lean()
            .sort([['createdAt, -1']])
            .limit(limit)
            .skip(skip);
        integrationQuery = handleSelect(select, integrationQuery);
        integrationQuery = handlePopulate(populate, integrationQuery);
        const result = await integrationQuery;

        return result;
    },

    // create a new integration
    create: async function(
        projectId,
        userId,
        data,
        integrationType,
        notificationOptions
    ) {
        const _this = this;
        const integrationModel = new IntegrationModel(data);
        integrationModel.projectId = projectId;
        integrationModel.createdById = userId;
        integrationModel.data = data;
        integrationModel.integrationType = integrationType;
        data.monitors =
            data.monitors &&
            data.monitors.map(monitor => ({
                monitorId: monitor,
            }));
        integrationModel.monitorId = data.monitorId || null;
        integrationModel.monitors = data.monitors || [];
        if (notificationOptions) {
            integrationModel.notificationOptions = notificationOptions;
        }

        let integration = await integrationModel.save();
        const select =
            'webHookName projectId createdById integrationType data monitors createdAt notificationOptions';
        const populate = [
            { path: 'createdById', select: 'name' },
            { path: 'projectId', select: 'name' },
            {
                path: 'monitors.monitorId',
                select: 'name',
                populate: [{ path: 'componentId', select: 'name' }],
            },
        ];
        integration = await _this.findOneBy({
            query: { _id: integration._id },
            select,
            populate,
        });
        return integration;
    },

    countBy: async function(query) {
        if (!query) {
            query = {};
        }

        query.deleted = false;
        const count = await IntegrationModel.countDocuments(query);
        return count;
    },

    deleteBy: async function(query, userId) {
        if (!query) {
            query = {};
        }
        if (!query.deleted) query.deleted = false;
        const integration = await IntegrationModel.findOneAndUpdate(query, {
            $set: {
                deleted: true,
                deletedById: userId,
                deletedAt: Date.now(),
            },
        });
        return integration;
    },

    findOneBy: async function({ query, select, populate }) {
        if (!query) query = {};

        if (query.deleted) query.deleted = false;
        let integrationQuery = IntegrationModel.findOne(query)
            .lean()
            .sort([['createdAt, -1']]);
        integrationQuery = handleSelect(select, integrationQuery);
        integrationQuery = handlePopulate(populate, integrationQuery);
        const result = await integrationQuery;

        return result;
    },

    updateOneBy: async function(query, data) {
        const _this = this;
        if (!query) {
            query = {};
        }

        if (!data._id) {
            const integration = await _this.create(
                data.projectId,
                data.userId,
                data,
                data.integrationType
            );
            return integration;
        } else {
            query.deleted = false;

            let updatedIntegration = await IntegrationModel.findOneAndUpdate(
                query,
                {
                    $set: {
                        monitors: data.monitors,
                        'data.webHookName': data.webHookName,
                        'data.endpoint': data.endpoint,
                        'data.monitors': data.monitors,
                        'data.endpointType': data.endpointType,
                        'notificationOptions.incidentCreated':
                            data.incidentCreated,
                        'notificationOptions.incidentResolved':
                            data.incidentResolved,
                        'notificationOptions.incidentAcknowledged':
                            data.incidentAcknowledged,
                        'notificationOptions.incidentNoteAdded':
                            data.incidentNoteAdded,
                    },
                },
                { new: true }
            );
            const select =
                'webHookName projectId createdById integrationType data monitors createdAt notificationOptions';
            const populate = [
                { path: 'createdById', select: 'name' },
                { path: 'projectId', select: 'name' },
                {
                    path: 'monitors.monitorId',
                    select: 'name',
                    populate: [{ path: 'componentId', select: 'name' }],
                },
            ];
            updatedIntegration = await _this.findOneBy({
                query: { _id: updatedIntegration._id },
                select,
                populate,
            });
            return updatedIntegration;
        }
    },

    updateBy: async function(query, data) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        let updatedData = await IntegrationModel.updateMany(query, {
            $set: data,
        });
        const select =
            'webHookName projectId createdById integrationType data monitors createdAt notificationOptions';
        const populate = [
            { path: 'createdById', select: 'name' },
            { path: 'projectId', select: 'name' },
            {
                path: 'monitors.monitorId',
                select: 'name',
                populate: [{ path: 'componentId', select: 'name' }],
            },
        ];
        updatedData = await this.findBy({ query, select, populate });
        return updatedData;
    },

    removeMonitor: async function(monitorId, userId) {
        let query = {};
        if (monitorId) {
            query = { monitorId: monitorId };
        }
        query.deleted = false;
        const integrations = await IntegrationModel.updateMany(query, {
            $set: {
                deleted: true,
                deletedAt: Date.now(),
                deletedById: userId,
            },
        });
        return integrations;
    },

    restoreBy: async function(query) {
        const _this = this;
        query.deleted = true;
        const select =
            'webHookName projectId createdById integrationType data monitors createdAt notificationOptions';
        const populate = [
            { path: 'createdById', select: 'name' },
            { path: 'projectId', select: 'name' },
            {
                path: 'monitors.monitorId',
                select: 'name',
                populate: [{ path: 'componentId', select: 'name' }],
            },
        ];
        const integration = await _this.findBy({ query, select, populate });
        if (integration && integration.length > 1) {
            const integrations = await Promise.all(
                integration.map(async integration => {
                    const integrationId = integration._id;
                    integration = await _this.updateOneBy(
                        {
                            _id: integrationId,
                        },
                        {
                            deleted: false,
                            deletedAt: null,
                            deleteBy: null,
                        }
                    );
                    return integration;
                })
            );
            return integrations;
        }
    },
    hardDeleteBy: async function(query) {
        await IntegrationModel.deleteMany(query);
        return 'Integration(s) Removed Successfully!';
    },
};
const IntegrationModel = require('../models/integration');
const handleSelect = require('../utils/select');
const handlePopulate = require('../utils/populate');
