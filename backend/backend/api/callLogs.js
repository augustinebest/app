const express = require('express');
const router = express.Router();

const CallLogsService = require('../services/callLogsService');
const getUser = require('../middlewares/user').getUser;
const isUserMasterAdmin = require('../middlewares/user').isUserMasterAdmin;

const sendErrorResponse = require('../middlewares/response').sendErrorResponse;
const sendListResponse = require('../middlewares/response').sendListResponse;
const { sendItemResponse } = require('../middlewares/response');

router.get('/', getUser, isUserMasterAdmin, async function(req, res) {
    try {
        const query = {};
        const skip = req.query.skip;
        const limit = req.query.limit;
        const populate = [{ path: 'projectId', select: 'name' }];
        const select = 'from to projectId content status error';
        const [callLogs, count] = await Promise.all([
            CallLogsService.findBy({ query, limit, skip, select, populate }),
            CallLogsService.countBy(query),
        ]);
        return sendListResponse(req, res, callLogs, count);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.post('/', getUser, isUserMasterAdmin, async (req, res) => {
    try {
        const data = req.body;

        if (!data) {
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Values should not be null',
            });
        }
        if (!data.status || !data.status.trim()) {
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Call Log Status is required',
            });
        }
        if (!data.from || !data.from.trim()) {
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Call Log Sender name is required',
            });
        }

        if (!data.to || !data.to.trim()) {
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Call Log Recipient name is required',
            });
        }

        if (!data.projectId || !data.projectId.trim()) {
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Call Log ProjectId is required',
            });
        }

        if (!data.content || !data.content.trim()) {
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Call Log Content is required',
            });
        }
        const callLog = await CallLogsService.create(data);
        return sendItemResponse(req, res, callLog);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.post('/search', getUser, isUserMasterAdmin, async function(req, res) {
    try {
        const filter = req.body.filter;
        const skip = req.query.skip;
        const limit = req.query.limit;

        const {
            searchedCallLogs,
            totalSearchCount,
        } = await CallLogsService.search({ filter, skip, limit });

        return sendListResponse(req, res, searchedCallLogs, totalSearchCount);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.delete('/', getUser, isUserMasterAdmin, async function(req, res) {
    try {
        const query = {};

        const msg = await CallLogsService.hardDeleteBy({ query });

        return sendItemResponse(req, res, msg);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

module.exports = router;
