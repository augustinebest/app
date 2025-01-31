const express = require('express');
const alertService = require('../services/alertService');
const IncidentService = require('../services/incidentService');
const alertChargeService = require('../services/alertChargeService');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { isAuthorized } = require('../middlewares/authorization');
const getUser = require('../middlewares/user').getUser;
const getSubProjects = require('../middlewares/subProject').getSubProjects;
const isUserOwner = require('../middlewares/project').isUserOwner;

const sendErrorResponse = require('../middlewares/response').sendErrorResponse;
const sendListResponse = require('../middlewares/response').sendListResponse;
const sendItemResponse = require('../middlewares/response').sendItemResponse;

router.post('/:projectId', getUser, isAuthorized, async function(req, res) {
    try {
        const projectId = req.params.projectId;
        const userId = req.user.id;
        const data = req.body;
        data.projectId = projectId;
        const alert = await alertService.create({
            projectId,
            monitorId: data.monitorId,
            alertVia: data.alertVia,
            userId: userId,
            incidentId: data.incidentId,
            eventType: data.eventType,
        });
        return sendItemResponse(req, res, alert);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

// Fetch alerts by projectId
router.get('/:projectId', getUser, isAuthorized, getSubProjects, async function(
    req,
    res
) {
    try {
        const subProjectIds = req.user.subProjects
            ? req.user.subProjects.map(project => project._id)
            : null;
        const alerts = await alertService.getSubProjectAlerts(subProjectIds);
        return sendItemResponse(req, res, alerts); // frontend expects sendItemResponse
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.get('/:projectId/alert', getUser, isAuthorized, async function(
    req,
    res
) {
    try {
        const projectId = req.params.projectId;
        const populateAlert = [
            { path: 'userId', select: 'name' },
            { path: 'monitorId', select: 'name' },
            { path: 'projectId', select: 'name' },
        ];

        const selectColumns =
            '_id projectId userId alertVia alertStatus eventType monitorId createdAt incidentId onCallScheduleStatus schedule escalation error errorMessage alertProgress deleted deletedAt deletedById';

        const [alerts, count] = await Promise.all([
            alertService.findBy({
                query: { projectId },
                skip: req.query.skip || 0,
                limit: req.query.limit || 10,
                populate: populateAlert,
                select: selectColumns,
            }),
            alertService.countBy({ projectId }),
        ]);
        return sendListResponse(req, res, alerts, count); // frontend expects sendListResponse
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.get(
    '/:projectId/incident/:incidentSlug',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const incidentSlug = req.params.incidentSlug;
            // const projectId = req.params.projectId;
            let incidentId = await IncidentService.findOneBy({
                // query: { projectId, slug: incidentSlug },
                query: { slug: incidentSlug },
                select: '_id',
            });
            const skip = req.query.skip || 0;
            const limit = req.query.limit || 10;

            let alerts = [],
                count = 0;
            if (incidentId) {
                incidentId = incidentId._id;
                const populateAlert = [
                    { path: 'userId', select: 'name email' },
                    { path: 'monitorId', select: 'name' },
                    { path: 'projectId', select: 'name' },
                ];

                const selectColumns =
                    '_id projectId userId alertVia alertStatus eventType monitorId createdAt incidentId onCallScheduleStatus schedule escalation error errorMessage alertProgress deleted deletedAt deletedById';

                const [allAlerts, allCount] = await Promise.all([
                    alertService.findBy({
                        query: { incidentId: incidentId },
                        skip,
                        limit,
                        populate: populateAlert,
                        select: selectColumns,
                    }),
                    alertService.countBy({
                        incidentId: incidentId,
                    }),
                ]);

                alerts = allAlerts;
                count = allCount;
            }
            return sendListResponse(req, res, alerts, count);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

// Mark alert as viewed. This is for Email.
router.get('/:projectId/:alertId/viewed', async function(req, res) {
    try {
        const alertId = req.params.alertId;
        const projectId = req.params.projectId;
        await alertService.updateOneBy(
            { _id: alertId, projectId: projectId },
            { alertStatus: 'Viewed' }
        );
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'views',
            'img',
            'vou-wb.png'
        );
        const img = fs.readFileSync(filePath);

        res.set('Content-Type', 'image/png');
        res.status(200);
        res.end(img, 'binary');
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.delete('/:projectId', getUser, isUserOwner, async function(req, res) {
    try {
        const projectId = req.params.projectId;
        const userId = req.user.id;
        const alert = await alertService.deleteBy(
            { projectId: projectId },
            userId
        );
        if (!alert) {
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Alert not found',
            });
        }
        return sendItemResponse(req, res, alert);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.get('/:projectId/alert/charges', getUser, isAuthorized, async function(
    req,
    res
) {
    try {
        const projectId = req.params.projectId;

        //Important! Always pass required field(s)
        const populate = [
            { path: 'alertId', select: 'alertVia' },
            { path: 'subscriberAlertId', select: 'alertVia' },
            { path: 'monitorId', select: 'name slug' },
            { path: 'incidentId', select: 'idNumber slug' },
        ];

        const select =
            'alertId subscriberAlertId monitorId incidentId closingAccountBalance chargeAmount';

        const [alertCharges, count] = await Promise.all([
            alertChargeService.findBy({
                query: { projectId },
                skip: req.query.skip,
                limit: req.query.limit,
                sort: false,
                populate,
                select,
            }),
            alertChargeService.countBy({ projectId }),
        ]);
        return sendListResponse(req, res, alertCharges, count);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

module.exports = router;
