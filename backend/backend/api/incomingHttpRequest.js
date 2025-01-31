const express = require('express');
const router = express.Router();
const ProbeService = require('../services/probeService');
const sendErrorResponse = require('../middlewares/response').sendErrorResponse;
const sendItemResponse = require('../middlewares/response').sendItemResponse;
const { isValidMonitor } = require('../middlewares/api');

const incomingHttpRequest = async function(req, res) {
    try {
        const monitor = req.monitor;
        const body = req.body;
        const queryParams = req.query;
        const headers = req.headers;
        const response = await ProbeService.processHttpRequest({
            monitor,
            body,
            queryParams,
            headers,
        });
        return sendItemResponse(req, res, response);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
};

router.get('/:id', isValidMonitor, incomingHttpRequest);

router.post('/:id', isValidMonitor, incomingHttpRequest);

module.exports = router;
