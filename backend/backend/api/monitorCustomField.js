const express = require('express');
const { isAuthorized } = require('../middlewares/authorization');
const { getUser } = require('../middlewares/user');
const {
    sendErrorResponse,
    sendItemResponse,
    sendListResponse,
} = require('../middlewares/response');
const MonitorCustomFieldService = require('../services/monitorCustomField');

const router = express.Router();

router.post('/:projectId', getUser, isAuthorized, async function(req, res) {
    try {
        const { projectId } = req.params;
        const { fieldName, fieldType, uniqueField } = req.body;

        if (!fieldName || !fieldName.trim()) {
            const error = new Error('Field name is required');
            error.code = 400;
            throw error;
        }

        if (!fieldType || !fieldType.trim()) {
            const error = new Error('Field type is required');
            error.code = 400;
            throw error;
        }
        const selectMonCustomField =
            'fieldName fieldType projectId uniqueField deleted';

        const populateMonCustomField = [{ path: 'projectId', select: 'name' }];

        let customField = await MonitorCustomFieldService.findOneBy({
            query: { projectId, fieldName },
            select: selectMonCustomField,
            populate: populateMonCustomField,
        });
        if (customField) {
            const error = new Error(
                'Custom field with this name already exist'
            );
            error.code = 400;
            throw error;
        }

        customField = await MonitorCustomFieldService.create({
            projectId,
            fieldName,
            fieldType,
            uniqueField,
        });
        return sendItemResponse(req, res, customField);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.get('/:projectId', getUser, isAuthorized, async function(req, res) {
    try {
        const { projectId } = req.params;
        const { limit, skip } = req.query;
        const selectMonCustomField =
            'fieldName fieldType projectId uniqueField deleted';

        const populateMonCustomField = [{ path: 'projectId', select: 'name' }];
        const [customFields, count] = await Promise.all([
            MonitorCustomFieldService.findBy({
                query: {
                    projectId,
                },
                limit,
                skip,
                select: selectMonCustomField,
                populate: populateMonCustomField,
            }),
            MonitorCustomFieldService.countBy({
                projectId,
            }),
        ]);

        return sendListResponse(req, res, customFields, count);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.put('/:projectId/:customFieldId', getUser, isAuthorized, async function(
    req,
    res
) {
    try {
        const { projectId, customFieldId } = req.params;
        const { fieldName, fieldType, uniqueField } = req.body;

        if (!fieldName || !fieldName.trim()) {
            const error = new Error('Field name is required');
            error.code = 400;
            throw error;
        }

        if (!fieldType || !fieldType.trim()) {
            const error = new Error('Field type is required');
            error.code = 400;
            throw error;
        }

        let customField = await MonitorCustomFieldService.findOneBy({
            query: { projectId, fieldName },
            select: '_id',
        });
        if (customField && String(customField._id) !== String(customFieldId)) {
            const error = new Error(
                'Custom field with this name already exist'
            );
            error.code = 400;
            throw error;
        }

        customField = await MonitorCustomFieldService.updateOneBy(
            { _id: customFieldId, projectId },
            {
                fieldName,
                fieldType,
                uniqueField,
            }
        );
        return sendItemResponse(req, res, customField);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.delete(
    '/:projectId/:customFieldId',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const { projectId, customFieldId } = req.params;

            const deletedCustomField = await MonitorCustomFieldService.deleteBy(
                {
                    _id: customFieldId,
                    projectId,
                }
            );

            return sendItemResponse(req, res, deletedCustomField);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

module.exports = router;
