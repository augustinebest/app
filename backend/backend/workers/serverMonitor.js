const moment = require('moment');
const MonitorService = require('../services/monitorService'),
    MonitorLogService = require('../services/monitorLogService'),
    MonitorStatusService = require('../services/monitorStatusService'),
    ProbeService = require('../services/probeService'),
    ErrorService = require('../services/errorService');

module.exports = {
    checkAllServerMonitors: async () => {
        try {
            const newDate = new moment();
            const monitors = await MonitorService.findBy({
                type: 'server-monitor',
            });
            if (monitors) {
                monitors.forEach(async monitor => {
                    const d = new moment(monitor.lastPingTime);
                    const log = await MonitorLogService.findOneBy({
                        monitorId: monitor._id,
                    });
                    const monitorStatus = await MonitorStatusService.findOneBy({
                        monitorId: monitor._id,
                    });

                    if (
                        newDate.diff(d, 'minutes') > 3 &&
                        (!log ||
                            (monitorStatus &&
                                monitorStatus.status !== 'offline'))
                    ) {
                        await job(monitor);
                    }
                });
            } else {
                return;
            }
        } catch (error) {
            ErrorService.log('serverMonitorCron.checkAllServerMonitor', error);
            throw error;
        }
    },
};

const job = async monitor => {
    try {
        const { stat: validUp, reasons } = await (monitor &&
        monitor.criteria &&
        monitor.criteria.up
            ? ProbeService.conditions(null, null, monitor.criteria.up)
            : { stat: false, reasons: [] });
        const { stat: validDown } = await (monitor &&
        monitor.criteria &&
        monitor.criteria.down
            ? ProbeService.conditions(null, null, monitor.criteria.down)
            : { stat: false });
        if (!validUp || validDown) {
            await ProbeService.saveMonitorLog({
                monitorId: monitor._id,
                status: 'offline',
                reason: reasons,
            });
        }
    } catch (error) {
        ErrorService.log('serverMonitorCron.job', error);
        throw error;
    }
};