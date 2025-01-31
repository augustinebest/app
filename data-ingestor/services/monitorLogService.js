const MonitorLogByHourService = require('../services/monitorLogByHourService');
const MonitorLogByDayService = require('../services/monitorLogByDayService');
const MonitorLogByWeekService = require('../services/monitorLogByWeekService');
const MonitorService = require('../services/monitorService');
const ErrorService = require('../services/errorService');
const moment = require('moment');
const monitorLogCollection = global.db.collection('monitorlogs');
const { ObjectId } = require('mongodb');
const { postApi } = require('../utils/api');
const { realtimeUrl } = require('../utils/config');
const ProjectService = require('./projectService');

const realtimeBaseUrl = `${realtimeUrl}/realtime`;

module.exports = {
    create: async function(data) {
        try {
            const Log = {};
            let responseBody = '';
            if (data.resp && data.resp.body) {
                if (typeof data.resp.body === 'object') {
                    responseBody = JSON.stringify(data.resp.body);
                } else {
                    responseBody = data.resp.body;
                }
            } else {
                responseBody = '';
            }
            Log.monitorId = data.monitorId;
            Log.probeId = data.probeId;
            Log.status = data.status;
            Log.responseTime = data.responseTime;
            Log.responseStatus = data.responseStatus;
            Log.responseBody = responseBody;
            Log.responseHeader =
                data.rawResp && data.rawResp.headers
                    ? data.rawResp.headers
                    : {};
            Log.cpuLoad = data.cpuLoad;
            Log.avgCpuLoad = data.avgCpuLoad;
            Log.cpuCores = data.cpuCores;
            Log.memoryUsed = data.memoryUsed;
            Log.totalMemory = data.totalMemory;
            Log.swapUsed = data.swapUsed;
            Log.storageUsed = data.storageUsed;
            Log.totalStorage = data.totalStorage;
            Log.storageUsage = data.storageUsage;
            Log.mainTemp = data.mainTemp;
            Log.maxTemp = data.maxTemp;
            Log.sslCertificate = data.sslCertificate;
            Log.kubernetesLog = data.kubernetesData || {};

            Log.createdAt = new Date(moment().format());

            // script log details
            Log.scriptMetadata = data.scriptMetadata;

            const result = await monitorLogCollection.insertOne(Log);
            const savedLog = await this.findOneBy({
                _id: ObjectId(result.insertedId),
            });

            // run these in background.
            this.updateAggregateLogs(data);
            this.sendMonitorLog(savedLog);

            return savedLog;
        } catch (error) {
            ErrorService.log('monitorLogService.create', error);
            throw error;
        }
    },

    updateAggregateLogs: async function(data) {
        try {
            const now = new Date();
            const intervalHourDate = moment(now).format('MMM Do YYYY, h A');
            const intervalDayDate = moment(now).format('MMM Do YYYY');
            const intervalWeekDate = moment(now).format('wo [week of] YYYY');

            const [logByHour, logByDay, logByWeek] = await Promise.all([
                MonitorLogByHourService.findOneBy({
                    probeId: data.probeId,
                    monitorId: data.monitorId,
                    intervalDate: intervalHourDate,
                }),
                MonitorLogByDayService.findOneBy({
                    probeId: data.probeId,
                    monitorId: data.monitorId,
                    intervalDate: intervalDayDate,
                }),
                MonitorLogByWeekService.findOneBy({
                    probeId: data.probeId,
                    monitorId: data.monitorId,
                    intervalDate: intervalWeekDate,
                }),
            ]);

            if (logByHour) {
                await MonitorLogByHourService.updateOneBy(
                    { _id: ObjectId(logByHour._id) },
                    {
                        ...data,
                        createdAt: new Date(moment().format()),
                        maxResponseTime:
                            data.responseTime > logByHour.maxResponseTime
                                ? data.responseTime
                                : logByHour.maxResponseTime,
                        maxCpuLoad:
                            data.cpuLoad > logByHour.maxCpuLoad
                                ? data.cpuLoad
                                : logByHour.maxCpuLoad,
                        maxMemoryUsed:
                            data.memoryUsed > logByHour.maxMemoryUsed
                                ? data.memoryUsed
                                : logByHour.maxMemoryUsed,
                        maxStorageUsed:
                            data.storageUsed > logByHour.maxStorageUsed
                                ? data.storageUsed
                                : logByHour.maxStorageUsed,
                        maxMainTemp:
                            data.mainTemp > logByHour.maxMainTemp
                                ? data.mainTemp
                                : logByHour.maxMainTemp,
                    }
                );
            } else {
                await MonitorLogByHourService.create({
                    ...data,
                    intervalDate: intervalHourDate,
                });
            }
            if (logByDay) {
                await MonitorLogByDayService.updateOneBy(
                    { _id: ObjectId(logByDay._id) },
                    {
                        ...data,
                        createdAt: new Date(moment().format()),
                        maxResponseTime:
                            data.responseTime > logByDay.maxResponseTime
                                ? data.responseTime
                                : logByDay.maxResponseTime,
                        maxCpuLoad:
                            data.cpuLoad > logByDay.maxCpuLoad
                                ? data.cpuLoad
                                : logByDay.maxCpuLoad,
                        maxMemoryUsed:
                            data.memoryUsed > logByDay.maxMemoryUsed
                                ? data.memoryUsed
                                : logByDay.maxMemoryUsed,
                        maxStorageUsed:
                            data.storageUsed > logByDay.maxStorageUsed
                                ? data.storageUsed
                                : logByDay.maxStorageUsed,
                        maxMainTemp:
                            data.mainTemp > logByDay.maxMainTemp
                                ? data.mainTemp
                                : logByDay.maxMainTemp,
                    }
                );
            } else {
                await MonitorLogByDayService.create({
                    ...data,
                    intervalDate: intervalDayDate,
                });
            }
            if (logByWeek) {
                await MonitorLogByWeekService.updateOneBy(
                    { _id: ObjectId(logByWeek._id) },
                    {
                        ...data,
                        createdAt: new Date(moment().format()),
                        maxResponseTime:
                            data.responseTime > logByWeek.maxResponseTime
                                ? data.responseTime
                                : logByWeek.maxResponseTime,
                        maxCpuLoad:
                            data.cpuLoad > logByWeek.maxCpuLoad
                                ? data.cpuLoad
                                : logByWeek.maxCpuLoad,
                        maxMemoryUsed:
                            data.memoryUsed > logByWeek.maxMemoryUsed
                                ? data.memoryUsed
                                : logByWeek.maxMemoryUsed,
                        maxStorageUsed:
                            data.storageUsed > logByWeek.maxStorageUsed
                                ? data.storageUsed
                                : logByWeek.maxStorageUsed,
                        maxMainTemp:
                            data.mainTemp > logByWeek.maxMainTemp
                                ? data.mainTemp
                                : logByWeek.maxMainTemp,
                    }
                );
            } else {
                await MonitorLogByWeekService.create({
                    ...data,
                    intervalDate: intervalWeekDate,
                });
            }
        } catch (error) {
            ErrorService.log('monitorLogService.updateAggregateLogs', error);
            throw error;
        }
    },

    updateOneBy: async function(query, data) {
        try {
            if (!query) {
                query = {};
            }

            await monitorLogCollection.updateOne(query, {
                $set: data,
            });
            const monitorLog = await this.findOneBy(query);

            return monitorLog;
        } catch (error) {
            ErrorService.log('monitorLogService.updateOneBy', error);
            throw error;
        }
    },

    async findOneBy(query) {
        try {
            if (!query) {
                query = {};
            }

            if (!query.deleted)
                query.$or = [
                    { deleted: false },
                    { deleted: { $exists: false } },
                ];

            let monitorLog = await monitorLogCollection
                .aggregate([
                    { $match: query },
                    { $addFields: { probeId: { $toObjectId: '$probeId' } } },
                    {
                        $lookup: {
                            from: 'probes',
                            localField: 'probeId',
                            foreignField: '_id',
                            as: 'probeId',
                        },
                    },
                ])
                .toArray();
            monitorLog = monitorLog[0]; // we are only concerned with the first item
            if (monitorLog.probeId && Array.isArray(monitorLog.probeId)) {
                monitorLog.probeId = monitorLog.probeId[0];
            }

            return monitorLog;
        } catch (error) {
            ErrorService.log('monitorLogService.findOneBy', error);
            throw error;
        }
    },

    async sendMonitorLog(data) {
        try {
            const [monitor, logData] = await Promise.all([
                MonitorService.findOneBy({
                    query: { _id: ObjectId(data.monitorId) },
                    // select: 'projectId',
                    // populate: [{ path: 'projectId', select: '_id' }],
                }),
                this.findOneBy({ _id: ObjectId(data._id) }),
            ]);

            if (monitor && monitor.projectId) {
                const project = await ProjectService.findOneBy({
                    query: {
                        _id: ObjectId(
                            monitor.projectId._id || monitor.projectId
                        ),
                    },
                });
                const parentProjectId = project
                    ? project.parentProjectId
                        ? project.parentProjectId._id || project.parentProjectId
                        : project._id
                    : monitor.projectId._id || monitor.projectId;

                // realtime update
                postApi(
                    `${realtimeBaseUrl}/update-monitor-log`,
                    {
                        data,
                        monitorId: data.monitorId,
                        logData,
                        parentProjectId,
                        projectId: monitor.projectId._id || monitor.projectId,
                    },
                    true
                ).catch(error => {
                    ErrorService.log('monitorLogService.sendMonitorLog', error);
                });
            }
        } catch (error) {
            ErrorService.log('monitorLogService.sendMonitorLog', error);
            throw error;
        }
    },
};
