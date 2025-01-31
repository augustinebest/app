const express = require('express');
const getUser = require('../middlewares/user').getUser;
const { isAuthorized } = require('../middlewares/authorization');
const sendErrorResponse = require('../middlewares/response').sendErrorResponse;
const sendItemResponse = require('../middlewares/response').sendItemResponse;
const sendListResponse = require('../middlewares/response').sendListResponse;
const IncomingRequestService = require('../services/incomingRequestService');

const router = express.Router();

router.get(
    '/:projectId/all-incoming-request',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const { projectId } = req.params;
            const { limit, skip } = req.query;
            const select =
                'name projectId monitors isDefault selectAllMonitors createIncident acknowledgeIncident resolveIncident updateIncidentNote updateInternalNote noteContent incidentState url enabled incidentTitle incidentType incidentPriority incidentDescription customFields filterMatch filters createSeparateIncident post_statuspage deleted';

            const populate = [
                {
                    path: 'monitors.monitorId',
                    select: 'name customFields componentId deleted',
                    populate: [{ path: 'componentId', select: 'name' }],
                },
                { path: 'projectId', select: 'name' },
            ];
            const [allIncomingRequest, count] = await Promise.all([
                IncomingRequestService.findBy({
                    query: {
                        projectId,
                    },
                    limit,
                    skip,
                    select,
                    populate,
                }),
                IncomingRequestService.countBy({
                    projectId,
                }),
            ]);

            return sendListResponse(req, res, allIncomingRequest, count);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

router.post(
    '/:projectId/create-request-url',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const { projectId } = req.params;
            const data = req.body;

            if (!data.name || !data.name.trim()) {
                const error = new Error(
                    'Please specify a name for the incoming request'
                );
                error.code = 400;
                throw error;
            }
            const select =
                'name projectId monitors isDefault selectAllMonitors createIncident acknowledgeIncident resolveIncident updateIncidentNote updateInternalNote noteContent incidentState url enabled incidentTitle incidentType incidentPriority incidentDescription customFields filterMatch filters createSeparateIncident post_statuspage deleted';

            const populate = [
                {
                    path: 'monitors.monitorId',
                    select: 'name customFields componentId deleted',
                    populate: [{ path: 'componentId', select: 'name' }],
                },
                { path: 'projectId', select: 'name' },
            ];
            let incomingRequest = await IncomingRequestService.findOneBy({
                query: { name: data.name, projectId },
                select,
                populate,
            });
            if (incomingRequest) {
                const error = new Error(
                    'Incoming request with this name already exist'
                );
                error.code = 400;
                throw error;
            }

            data.projectId = projectId;
            incomingRequest = await IncomingRequestService.create(data);
            // requestUrl contains the whole incoming request object with the updated url
            const requestUrl = await IncomingRequestService.getRequestUrl(
                projectId,
                incomingRequest._id
            );

            return sendItemResponse(req, res, requestUrl);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

router.put(
    '/:projectId/update/:requestId',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const { projectId, requestId } = req.params;
            const data = req.body;

            if (!data.name || !data.name.trim()) {
                const error = new Error(
                    'Please specify a name for the incoming request'
                );
                error.code = 400;
                throw error;
            }
            const select =
                'name projectId monitors isDefault selectAllMonitors createIncident acknowledgeIncident resolveIncident updateIncidentNote updateInternalNote noteContent incidentState url enabled incidentTitle incidentType incidentPriority incidentDescription customFields filterMatch filters createSeparateIncident post_statuspage deleted';

            const populate = [
                {
                    path: 'monitors.monitorId',
                    select: 'name customFields componentId deleted',
                    populate: [{ path: 'componentId', select: 'name' }],
                },
                { path: 'projectId', select: 'name' },
            ];

            let incomingRequest = await IncomingRequestService.findOneBy({
                query: { name: data.name, projectId },
                select,
                populate,
            });
            if (
                incomingRequest &&
                String(incomingRequest._id) !== String(requestId)
            ) {
                const error = new Error(
                    'Incoming request with this name already exist'
                );
                error.code = 400;
                throw error;
            }

            incomingRequest = await IncomingRequestService.updateOneBy(
                { requestId, projectId },
                data
            );
            return sendItemResponse(req, res, incomingRequest);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

router.delete(
    '/:projectId/remove/:requestId',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const { projectId, requestId } = req.params;

            const incomingRequest = await IncomingRequestService.deleteBy({
                _id: requestId,
                projectId,
            });
            return sendItemResponse(req, res, incomingRequest);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

// process incoming http request from post request
router.post('/:projectId/request/:requestId', async function(req, res) {
    try {
        // request object for use in variables
        const request = {
            body: { ...req.body },
            query: { ...req.query },
            headers: { ...req.headers },
        };

        const { projectId, requestId } = req.params;
        const data = { projectId, requestId, request };

        const response = await IncomingRequestService.handleIncomingRequestAction(
            data
        );
        return sendItemResponse(req, res, response);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

// process incoming http request from get request
router.get('/:projectId/request/:requestId', async function(req, res) {
    try {
        // request object for use in variables
        // request body won't be available for a get request
        const request = {
            query: { ...req.query },
            headers: { ...req.headers },
        };

        const { projectId, requestId } = req.params;
        const data = { projectId, requestId, request };

        const response = await IncomingRequestService.handleIncomingRequestAction(
            data
        );
        return sendItemResponse(req, res, response);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.post(
    '/:projectId/toggle/:requestId',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const { projectId, requestId } = req.params;
            const data = req.body;
            const select =
                'name projectId monitors isDefault selectAllMonitors createIncident acknowledgeIncident resolveIncident updateIncidentNote updateInternalNote noteContent incidentState url enabled incidentTitle incidentType incidentPriority incidentDescription customFields filterMatch filters createSeparateIncident post_statuspage deleted';

            const populate = [
                {
                    path: 'monitors.monitorId',
                    select: 'name customFields componentId deleted',
                    populate: [{ path: 'componentId', select: 'name' }],
                },
                { path: 'projectId', select: 'name' },
            ];

            let incomingRequest = await IncomingRequestService.findOneBy({
                query: { name: data.name, projectId },
                select,
                populate,
            });
            if (
                incomingRequest &&
                String(incomingRequest._id) !== String(requestId)
            ) {
                const error = new Error(
                    'Incoming request with this name already exist'
                );
                error.code = 400;
                throw error;
            }

            incomingRequest = await IncomingRequestService.updateOneBy(
                { requestId, projectId },
                data
            );
            return sendItemResponse(req, res, incomingRequest);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

module.exports = router;
