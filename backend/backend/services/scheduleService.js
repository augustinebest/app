module.exports = {
    findBy: async function({ query, limit, skip, select, populate }) {
        if (!skip) skip = 0;

        if (!limit) limit = 0;

        if (typeof skip === 'string') skip = parseInt(skip);

        if (typeof limit === 'string') limit = parseInt(limit);

        if (!query) query = {};

        if (!query.deleted) query.deleted = false;
        let schedulesQuery = ScheduleModel.find(query)
            .lean()
            .sort([['createdAt', -1]])
            .limit(limit)
            .skip(skip);

        schedulesQuery = handleSelect(select, schedulesQuery);
        schedulesQuery = handlePopulate(populate, schedulesQuery);

        const schedules = await schedulesQuery;
        return schedules;
    },

    findOneBy: async function({ query, select, populate }) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        let scheduleQuery = ScheduleModel.findOne(query)
            .lean()
            .sort([['createdAt', -1]]);

        scheduleQuery = handleSelect(select, scheduleQuery);
        scheduleQuery = handlePopulate(populate, scheduleQuery);

        const schedule = await scheduleQuery;

        return schedule;
    },

    create: async function(data) {
        const scheduleModel = new ScheduleModel();
        scheduleModel.name = data.name || null;
        scheduleModel.projectId = data.projectId || null;
        scheduleModel.createdById = data.createdById || null;

        // if userIds is array
        if (data.userIds) {
            scheduleModel.userIds = [];
            for (const userId of data.userIds) {
                scheduleModel.userIds.push(userId);
            }
        }

        // if monitorIds is array
        if (data.monitorIds) {
            scheduleModel.monitorIds = [];
            for (const monitorId of data.monitorIds) {
                scheduleModel.userIds.push(monitorId);
            }
        }

        if (data && data.name) {
            scheduleModel.slug = getSlug(data.name);
        }
        const schedule = await scheduleModel.save();
        const populate = [
            { path: 'userIds', select: 'name' },
            { path: 'createdById', select: 'name' },
            { path: 'monitorIds', select: 'name' },
            {
                path: 'projectId',
                select: '_id name slug',
            },
            {
                path: 'escalationIds',
                select: 'teamMember',
                populate: {
                    path: 'teamMember.userId',
                    select: 'name',
                },
            },
        ];

        const select =
            '_id userIds name slug projectId createdById monitorsIds escalationIds createdAt isDefault userIds';

        const newSchedule = await this.findOneBy({
            query: { _id: schedule._id },
            select,
            populate,
        });
        return newSchedule;
    },

    countBy: async function(query) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        const count = await ScheduleModel.countDocuments(query);
        return count;
    },

    deleteBy: async function(query, userId) {
        const schedule = await ScheduleModel.findOneAndUpdate(
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

        if (schedule && schedule._id) {
            const escalations = await EscalationService.findBy({
                query: { scheduleId: schedule._id },
                select: '_id',
            });
            await escalations.map(({ _id }) =>
                EscalationService.deleteBy({ _id: _id }, userId)
            );
        }

        return schedule;
    },

    addMonitorToSchedules: async function(scheduleIds, monitorId) {
        await ScheduleModel.updateMany(
            {
                _id: { $in: scheduleIds },
            },
            {
                $addToSet: {
                    monitorIds: monitorId,
                },
            }
        );
    },

    removeMonitor: async function(monitorId) {
        const schedule = await ScheduleModel.findOneAndUpdate(
            { monitorIds: monitorId },
            {
                $pull: { monitorIds: monitorId },
            }
        );
        return schedule;
    },

    updateOneBy: async function(query, data) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        const _this = this;
        let schedule = await _this.findOneBy({
            query,
            select: '_id userIds monitorIds',
        });
        let userIds = [];
        if (data.userIds) {
            for (const userId of data.userIds) {
                userIds.push(userId);
            }
        } else {
            userIds = schedule.userIds;
        }
        data.userIds = userIds;
        let monitorIds = [];
        if (data.monitorIds) {
            for (const monitorId of data.monitorIds) {
                monitorIds.push(monitorId);
            }
        } else {
            monitorIds = schedule.monitorIds;
        }
        data.monitorIds = monitorIds;

        if (data.isDefault) {
            // set isDefault to false for a particular schedule in a project
            // this should only affect any schedule not equal to the currently edited schedule
            await ScheduleModel.findOneAndUpdate(
                {
                    _id: { $ne: schedule._id },
                    isDefault: true,
                    deleted: false,
                    projectId: query.projectId,
                },
                { $set: { isDefault: false } },
                { new: true }
            );
        }
        if (data && data.name) {
            data.slug = getSlug(data.name);
        }

        schedule = await ScheduleModel.findOneAndUpdate(
            query,
            {
                $set: data,
            },
            {
                new: true,
            }
        );

        const populate = [
            { path: 'userIds', select: 'name' },
            { path: 'createdById', select: 'name' },
            { path: 'monitorIds', select: 'name' },
            {
                path: 'projectId',
                select: '_id name slug',
            },
            {
                path: 'escalationIds',
                select: 'teams',
                populate: {
                    path: 'teams.teamMembers.userId',
                    select: 'name email',
                },
            },
        ];

        const select =
            '_id name slug projectId createdById monitorsIds escalationIds createdAt isDefault userIds';

        schedule = await _this.findBy({
            query: { _id: query._id },
            limit: 10,
            skip: 0,
            populate,
            select,
        });
        return schedule;
    },

    updateBy: async function(query, data) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        let updatedData = await ScheduleModel.updateMany(query, {
            $set: data,
        });

        const populate = [
            { path: 'userIds', select: 'name' },
            { path: 'createdById', select: 'name' },
            { path: 'monitorIds', select: 'name' },
            {
                path: 'projectId',
                select: '_id name slug',
            },
            {
                path: 'escalationIds',
                select: 'teams',
                populate: {
                    path: 'teams.teamMembers.userId',
                    select: 'name email',
                },
            },
        ];

        const select =
            '_id name slug projectId createdById monitorsIds escalationIds createdAt isDefault userIds';
        updatedData = await this.findBy({ query, select, populate });
        return updatedData;
    },

    saveSchedule: async function(schedule) {
        schedule = await schedule.save();
        return schedule;
    },

    deleteMonitor: async function(monitorId) {
        await ScheduleModel.updateMany(
            { deleted: false },
            { $pull: { monitorIds: monitorId } }
        );
    },

    addEscalation: async function(scheduleId, escalations, userId) {
        const _this = this;
        const escalationIds = [];
        for (const data of escalations) {
            let escalation = {};
            if (!data._id) {
                escalation = await EscalationService.create(data);
            } else {
                escalation = await EscalationService.updateOneBy(
                    { _id: data._id },
                    data
                );
            }
            escalationIds.push(escalation._id);
        }

        if (escalationIds && escalationIds.length) {
            await _this.escalationCheck(escalationIds, scheduleId, userId);
        }
        await _this.updateOneBy(
            { _id: scheduleId },
            { escalationIds: escalationIds }
        );

        const scheduleEscalation = await _this.getEscalations(scheduleId);

        return scheduleEscalation.escalations;
    },

    getEscalations: async function(scheduleId) {
        const _this = this;
        const schedule = await _this.findOneBy({
            query: { _id: scheduleId },
            select: '_id escalationIds',
        });
        const selectEscalation =
            'projectId callReminders emailReminders smsReminders pushReminders rotateBy rotationInterval firstRotationOn rotationTimezone call email sms push createdById scheduleId teams createdAt deleted deletedAt';

        const populateEscalation = [
            {
                path: 'projectId',
                select: '_id name slug',
            },
            {
                path: 'scheduleId',
                select: 'name isDefault slug',
                populate: {
                    path: 'monitorIds',
                    select: 'name',
                },
            },
            {
                path: 'teams.teamMembers.user',
                select: 'name email',
            },
            {
                path: 'teams.teamMembers.groups',
                select: 'teams name',
            },
        ];

        const escalationIds = schedule.escalationIds;
        const escalations = await Promise.all(
            escalationIds.map(async escalationId => {
                return await EscalationService.findOneBy({
                    query: { _id: escalationId },
                    select: selectEscalation,
                    populate: populateEscalation,
                });
            })
        );
        return { escalations, count: escalationIds.length };
    },

    getUserEscalations: async function(subProjectIds, userId) {
        const selectEscalation =
            'projectId callReminders emailReminders smsReminders pushReminders rotateBy rotationInterval firstRotationOn rotationTimezone call email sms push createdById scheduleId teams createdAt deleted deletedAt';

        const populateEscalation = [
            { path: 'projectId', select: '_id name slug' },
            {
                path: 'scheduleId',
                select: 'name isDefault slug',
                populate: { path: 'monitorIds', select: 'name' },
            },
            {
                path: 'teams.teamMembers.user',
                select: 'name email',
            },
        ];
        const escalations = await EscalationService.findBy({
            query: {
                projectId: { $in: subProjectIds },
                'teams.teamMembers': { $elemMatch: { userId } },
            },
            select: selectEscalation,
            populate: populateEscalation,
        });
        return escalations;
    },

    escalationCheck: async function(escalationIds, scheduleId, userId) {
        const _this = this;
        let scheduleIds = await _this.findOneBy({
            query: { _id: scheduleId },
            select: '_id escalationIds',
        });

        scheduleIds = scheduleIds.escalationIds.map(i => i.toString());
        escalationIds = escalationIds.map(i => i.toString());

        scheduleIds.map(async id => {
            if (escalationIds.indexOf(id) < 0) {
                await EscalationService.deleteBy({ _id: id }, userId);
            }
        });
    },

    deleteEscalation: async function(escalationId) {
        await ScheduleModel.update(
            { deleted: false },
            { $pull: { escalationIds: escalationId } }
        );
    },

    getSubProjectSchedules: async function(subProjectIds) {
        const _this = this;
        const subProjectSchedules = await Promise.all(
            subProjectIds.map(async id => {
                const populate = [
                    { path: 'userIds', select: 'name' },
                    { path: 'createdById', select: 'name' },
                    { path: 'monitorIds', select: 'name' },
                    {
                        path: 'projectId',
                        select: '_id name slug',
                    },
                    {
                        path: 'escalationIds',
                        select: 'teams',
                        populate: {
                            path: 'teams.teamMembers.userId',
                            select: 'name email',
                        },
                    },
                    {
                        path: 'escalationIds',
                        select: 'teams',
                        populate: {
                            path: 'teams.teamMembers.groupId',
                            select: 'name',
                        },
                    },
                ];

                const select =
                    '_id name slug projectId createdById monitorsIds escalationIds createdAt isDefault  userIds';

                const query = { projectId: id };
                const schedules = await _this.findBy({
                    query,
                    limit: 10,
                    skip: 0,
                    populate,
                    select,
                });
                const count = await _this.countBy(query);
                return { schedules, count, _id: id, skip: 0, limit: 10 };
            })
        );
        return subProjectSchedules;
    },

    hardDeleteBy: async function(query) {
        await ScheduleModel.deleteMany(query);
        return 'Schedule(s) removed successfully';
    },

    restoreBy: async function(query) {
        const _this = this;
        query.deleted = true;
        const populate = [
            { path: 'userIds', select: 'name' },
            { path: 'createdById', select: 'name' },
            { path: 'monitorIds', select: 'name' },
            {
                path: 'projectId',
                select: '_id name slug',
            },
            {
                path: 'escalationIds',
                select: 'teams',
                populate: {
                    path: 'teams.teamMembers.userId',
                    select: 'name email',
                },
            },
        ];

        const select =
            '_id name slug projectId createdById monitorsIds escalationIds createdAt isDefault userIds';

        const schedule = await _this.findBy({ query, populate, select });
        if (schedule && schedule.length > 1) {
            const schedules = await Promise.all(
                schedule.map(async schedule => {
                    const scheduleId = schedule._id;
                    schedule = await _this.updateOneBy(
                        { _id: scheduleId, deleted: true },
                        {
                            deleted: false,
                            deletedAt: null,
                            deleteBy: null,
                        }
                    );
                    await EscalationService.restoreBy({
                        scheduleId,
                        deleted: true,
                    });
                    return schedule;
                })
            );
            return schedules;
        }
    },
};

const ScheduleModel = require('../models/schedule');
const EscalationService = require('../services/escalationService');
const getSlug = require('../utils/getSlug');
const handlePopulate = require('../utils/populate');
const handleSelect = require('../utils/select');
