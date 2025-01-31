const EscalationModel = require('../models/escalation');
const moment = require('moment');
const DateTime = require('../utils/DateTime');
const ScheduleService = require('./scheduleService');
const handleSelect = require('../utils/select');
const handlePopulate = require('../utils/populate');

module.exports = {
    findBy: async function({ query, limit, skip, sort, select, populate }) {
        if (!skip) skip = 0;

        if (!limit) limit = 10;

        if (typeof skip === 'string') skip = parseInt(skip);

        if (typeof limit === 'string') limit = parseInt(limit);

        if (!query) query = {};

        if (!query.deleted) query.deleted = false;
        let escalationsQuery = EscalationModel.find(query)
            .lean()
            .sort(sort)
            .limit(limit)
            .skip(skip);

        escalationsQuery = handleSelect(select, escalationsQuery);
        escalationsQuery = handlePopulate(populate, escalationsQuery);

        const escalations = await escalationsQuery;
        return escalations;
    },

    findOneBy: async function({ query, select, populate }) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        let escalationQuery = EscalationModel.findOne(query).lean();

        escalationQuery = handleSelect(select, escalationQuery);
        escalationQuery = handlePopulate(populate, escalationQuery);

        const escalation = await escalationQuery;

        const { activeTeam, nextActiveTeam } = computeActiveTeams(escalation);
        escalation.activeTeam = activeTeam;
        escalation.nextActiveTeam = nextActiveTeam;

        return escalation;
    },

    create: async function(data) {
        const escalationModel = new EscalationModel({
            call: data.call,
            email: data.email,
            sms: data.sms,
            push: data.push,
            callReminders: data.callReminders,
            smsReminders: data.smsReminders,
            emailReminders: data.emailReminders,
            pushReminders: data.pushReminders,
            rotateBy: data.rotateBy,
            rotationInterval: data.rotationInterval,
            firstRotationOn: data.firstRotationOn,
            rotationTimezone: data.rotationTimezone,
            projectId: data.projectId,
            scheduleId: data.scheduleId,
            createdById: data.createdById,
            teams: data.teams,
            groups: data.groups,
        });

        const escalation = await escalationModel.save();
        return escalation;
    },

    countBy: async function(query) {
        if (!query) {
            query = {};
        }

        query.deleted = false;
        const count = await EscalationModel.countDocuments(query);
        return count;
    },

    deleteBy: async function(query, userId) {
        const escalation = await EscalationModel.findOneAndUpdate(
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
        return escalation;
    },

    updateOneBy: async function(query, data) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        const escalation = await EscalationModel.findOneAndUpdate(
            query,
            {
                $set: data,
            },
            {
                new: true,
            }
        );
        return escalation;
    },

    updateBy: async function(query, data) {
        if (!query) {
            query = {};
        }

        if (!query.deleted) query.deleted = false;
        let updatedData = await EscalationModel.updateMany(query, {
            $set: data,
        });

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
        const selectEscalation =
            'projectId callReminders emailReminders smsReminders pushReminders rotateBy rotationInterval firstRotationOn rotationTimezone call email sms push createdById scheduleId teams createdAt deleted deletedAt';

        updatedData = await this.findBy({
            query,
            populate: populateEscalation,
            select: selectEscalation,
        });
        return updatedData;
    },

    deleteEscalationMember: async function(projectId, memberId, deletedById) {
        const _this = this;
        const escalations = await _this.findBy({
            query: { projectId },
            select: '_id teams scheduleId',
        });

        if (escalations && escalations.length > 0) {
            for (const escalation of escalations) {
                const teams = escalation.teams;
                const newTeams = [];
                for (const team of teams) {
                    const teamMembers = team.teamMembers;
                    const filtered = teamMembers
                        .filter(meamber => meamber['groupId'] !== memberId)
                        .filter(member => member['userId'] !== memberId);
                    newTeams.push({
                        _id: team._id,
                        teamMembers: filtered,
                    });
                    if (filtered.length < 1) {
                        const populateSchedule = [
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

                        const selectSchedule =
                            '_id userIds name slug projectId createdById monitorsIds escalationIds createdAt isDefault userIds';
                        const schedule = await ScheduleService.findOneBy({
                            query: { _id: escalation.scheduleId },
                            select: selectSchedule,
                            populate: populateSchedule,
                        });
                        const rmEscalation = schedule.escalationIds.filter(
                            escalationId =>
                                String(escalationId._id) !==
                                String(escalation._id)
                        );
                        schedule.escalationIds = rmEscalation;
                        await Promise.all([
                            ScheduleService.updateOneBy(
                                { _id: schedule._id },
                                { escalationIds: rmEscalation }
                            ),
                            _this.deleteBy(
                                { _id: escalation._id },
                                deletedById
                            ),
                        ]);
                    }
                }
                await _this.updateOneBy(
                    {
                        _id: escalation._id,
                    },
                    { teams: newTeams }
                );
            }
        }
    },

    hardDeleteBy: async function(query) {
        await EscalationModel.deleteMany(query);
        return 'Escalation(s) removed successfully';
    },

    restoreBy: async function(query) {
        const _this = this;
        query.deleted = true;
        let escalation = await _this.findBy({ query, select: '_id' });
        if (escalation && escalation.length > 1) {
            const escalations = await Promise.all(
                escalation.map(async escalation => {
                    const escalationId = escalation._id;
                    escalation = await _this.updateOneBy(
                        { _id: escalationId, deleted: true },
                        {
                            deleted: false,
                            deletedAt: null,
                            deleteBy: null,
                        }
                    );
                    return escalation;
                })
            );
            return escalations;
        } else {
            escalation = escalation[0];
            if (escalation) {
                const escalationId = escalation._id;
                escalation = await _this.updateOneBy(
                    { _id: escalationId, deleted: true },
                    {
                        deleted: false,
                        deletedAt: null,
                        deleteBy: null,
                    }
                );
            }
            return escalation;
        }
    },
};

function computeActiveTeamIndex(
    numberOfTeams,
    intervalDifference,
    rotationInterval
) {
    const difference = Math.floor(intervalDifference / rotationInterval);
    return difference % numberOfTeams;
}

function computeActiveTeams(escalation) {
    const {
        teams,
        rotationInterval,
        rotateBy,
        createdAt,
        rotationTimezone,
    } = escalation;

    let firstRotationOn = escalation.firstRotationOn;

    const currentDate = new Date();

    if (rotateBy && rotateBy != '') {
        let intervalDifference = 0;

        //convert rotation switch time to timezone.
        firstRotationOn = DateTime.changeDateTimezone(
            firstRotationOn,
            rotationTimezone
        );

        if (rotateBy === 'months') {
            intervalDifference = DateTime.getDifferenceInMonths(
                firstRotationOn,
                currentDate
            );
        }

        if (rotateBy === 'weeks') {
            intervalDifference = DateTime.getDifferenceInWeeks(
                firstRotationOn,
                currentDate
            );
        }

        if (rotateBy === 'days') {
            intervalDifference = DateTime.getDifferenceInDays(
                firstRotationOn,
                currentDate
            );
        }

        const activeTeamIndex = computeActiveTeamIndex(
            teams.length,
            intervalDifference,
            rotationInterval
        );
        let activeTeamRotationStartTime = null;

        //if the first rotation hasn't kicked in yet.
        if (DateTime.lessThan(currentDate, firstRotationOn)) {
            activeTeamRotationStartTime = createdAt;
        } else {
            activeTeamRotationStartTime = moment(firstRotationOn).add(
                intervalDifference,
                rotateBy
            );
        }

        const activeTeamRotationEndTime = moment(
            activeTeamRotationStartTime
        ).add(rotationInterval, rotateBy);
        const activeTeam = {
            _id: teams[activeTeamIndex]._id,
            teamMembers: teams[activeTeamIndex].teamMembers,
            rotationStartTime: activeTeamRotationStartTime,
            rotationEndTime: activeTeamRotationEndTime,
        };

        let nextActiveTeamIndex = activeTeamIndex + 1;

        if (!teams[nextActiveTeamIndex]) {
            nextActiveTeamIndex = 0;
        }

        const nextActiveTeamRotationStartTime = activeTeamRotationEndTime;
        const nextActiveTeamRotationEndTime = moment(
            nextActiveTeamRotationStartTime
        ).add(rotationInterval, rotateBy);
        const nextActiveTeam = {
            _id: teams[nextActiveTeamIndex]._id,
            teamMembers: teams[nextActiveTeamIndex].teamMembers,
            rotationStartTime: nextActiveTeamRotationStartTime,
            rotationEndTime: nextActiveTeamRotationEndTime,
        };

        return { activeTeam, nextActiveTeam };
    } else {
        return {
            activeTeam: {
                _id: teams[0]._id,
                teamMembers: teams[0].teamMembers,
                rotationStartTime: null,
                rotationEndTime: null,
            },
            nextActiveTeam: null,
        };
    }
}

module.exports.computeActiveTeams = computeActiveTeams;
