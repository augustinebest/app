module.exports = {
    create: async function(data) {
        const subscriberAlertModel = new SubscriberAlertModel();
        subscriberAlertModel.projectId = data.projectId || null;
        subscriberAlertModel.subscriberId = data.subscriberId || null;
        subscriberAlertModel.incidentId = data.incidentId || null;
        subscriberAlertModel.alertVia = data.alertVia || null;
        subscriberAlertModel.alertStatus = data.alertStatus || null;
        subscriberAlertModel.eventType = data.eventType || null;
        subscriberAlertModel.totalSubscribers = data.totalSubscribers || 0;
        subscriberAlertModel.identification = data.id || 0;
        if (data.error) {
            subscriberAlertModel.error = data.error;
            subscriberAlertModel.errorMessage = data.errorMessage;
        }
        const subscriberAlert = await subscriberAlertModel.save();
        return subscriberAlert;
    },

    updateOneBy: async function(query, data) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        //find and update
        const subscriberAlert = await SubscriberAlertModel.findOneAndUpdate(
            query,
            {
                $set: data,
            },
            {
                new: true,
            }
        );
        return subscriberAlert;
    },

    updateBy: async function(query, data) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        let updatedData = await SubscriberAlertModel.updateMany(query, {
            $set: data,
        });
        const populate = [
            { path: 'incidentId', select: 'name' },
            { path: 'projectId', select: 'name' },
            {
                path: 'subscriberId',
                select:
                    'name contactEmail contactPhone contactWebhook countryCode',
            },
        ];
        const select =
            'incidentId projectId subscriberId alertVia alertStatus eventType error errorMessage totalSubscribers identification';
        updatedData = await this.findBy({ query, select, populate });
        return updatedData;
    },

    deleteBy: async function(query, userId) {
        const subscriberAlert = await SubscriberAlertModel.findOneAndUpdate(
            query,
            {
                $set: {
                    deleted: true,
                    deletedById: userId,
                    deletedAt: Date.now(),
                },
            },
            {
                new: true,
            }
        );
        return subscriberAlert;
    },

    findBy: async function({ query, skip, limit, select, populate }) {
        if (!skip) skip = 0;

        if (!limit) limit = 10;

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

        let subscriberAlertQuery = SubscriberAlertModel.find(query)
            .lean()
            .sort([['createdAt', -1]])
            .limit(limit)
            .skip(skip);

        subscriberAlertQuery = handleSelect(select, subscriberAlertQuery);
        subscriberAlertQuery = handlePopulate(populate, subscriberAlertQuery);

        const subscriberAlerts = await subscriberAlertQuery;
        return subscriberAlerts;
    },

    findByOne: async function({ query, select, populate }) {
        if (!query) {
            query = {};
        }

        query.deleted = false;

        let subscriberAlertQuery = SubscriberAlertModel.find(query)
            .lean()
            .sort([['createdAt', -1]]);

        subscriberAlertQuery = handleSelect(select, subscriberAlertQuery);
        subscriberAlertQuery = handlePopulate(populate, subscriberAlertQuery);

        const subscriberAlert = await subscriberAlertQuery;
        return subscriberAlert;
    },

    countBy: async function(query) {
        if (!query) {
            query = {};
        }

        query.deleted = false;
        const count = await SubscriberAlertModel.countDocuments(query);
        return count;
    },

    hardDeleteBy: async function(query) {
        await SubscriberAlertModel.deleteMany(query);
        return 'Subscriber Alert(s) removed successfully';
    },
};

const SubscriberAlertModel = require('../models/subscriberAlert');
const handleSelect = require('../utils/select');
const handlePopulate = require('../utils/populate');
