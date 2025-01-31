const express = require('express');
const EmailTemplateService = require('../services/emailTemplateService');

const router = express.Router();

const createDOMPurify = require('dompurify');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const { isAuthorized } = require('../middlewares/authorization');
const getUser = require('../middlewares/user').getUser;
const isUserOwner = require('../middlewares/project').isUserOwner;

const sendErrorResponse = require('../middlewares/response').sendErrorResponse;
const sendItemResponse = require('../middlewares/response').sendItemResponse;

router.post('/:projectId', getUser, isAuthorized, async function(req, res) {
    try {
        const data = req.body;
        data.projectId = req.params.projectId;
        if (!data.subject) {
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Email subject is required.',
            });
        }

        if (!data.body) {
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Email body is required.',
            });
        }

        // sanitize template markup
        const [subject, body] = await Promise.all([
            DOMPurify.sanitize(data.subject),
            DOMPurify.sanitize(data.body, {
                WHOLE_DOCUMENT: true,
            }),
        ]);
        data.subject = subject;
        data.body = body;
        const emailTemplate = await EmailTemplateService.create(data);
        return sendItemResponse(req, res, emailTemplate);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.get(
    '/:projectId/:templateId/reset',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const projectId = req.params.projectId;
            const templateId = req.params.templateId;
            await EmailTemplateService.resetTemplate(projectId, templateId);
            const templates = await EmailTemplateService.getTemplates(
                projectId
            );
            return sendItemResponse(req, res, templates);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

router.get('/:projectId', getUser, isAuthorized, async function(req, res) {
    try {
        const projectId = req.params.projectId;
        const templates = await EmailTemplateService.getTemplates(projectId);
        return sendItemResponse(req, res, templates);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

router.get(
    '/:projectId/emailTemplate/:emailTemplateId',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const emailTemplateId = req.params.emailTemplateId;
            const select = 'projectId subject body emailType allowedVariables';
            const emailTemplates = await EmailTemplateService.findOneBy({
                query: { _id: emailTemplateId },
                select,
                populate: [{ path: 'projectId', select: 'nmae' }],
            });
            return sendItemResponse(req, res, emailTemplates);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

router.put(
    '/:projectId/emailTemplate/:emailTemplateId',
    getUser,
    isAuthorized,
    async function(req, res) {
        try {
            const data = req.body;
            const Id = req.params.emailTemplateId;
            // Call the EmailTemplateService
            const emailTemplate = await EmailTemplateService.updateOneBy(
                { _id: Id },
                data
            );
            return sendItemResponse(req, res, emailTemplate);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

router.put('/:projectId', getUser, isAuthorized, async function(req, res) {
    try {
        const data = [];
        const { projectId } = req.params;
        for (const value of req.body) {
            if (!value.subject) {
                return sendErrorResponse(req, res, {
                    code: 400,
                    message: 'Email subject is required.',
                });
            }

            if (!value.body) {
                return sendErrorResponse(req, res, {
                    code: 400,
                    message: 'Email body is required.',
                });
            }
            // sanitize template markup
            value.projectId = projectId;
            const [subject, body] = await Promise.all([
                DOMPurify.sanitize(value.subject),
                DOMPurify.sanitize(value.body, {
                    WHOLE_DOCUMENT: true,
                }),
            ]);
            value.subject = subject;
            value.body = body;
            data.push(value);
        }
        const select = 'projectId subject body emailType allowedVariables';
        for (const value of data) {
            const emailTemplate = await EmailTemplateService.findOneBy({
                query: {
                    projectId: value.projectId,
                    emailType: value.emailType,
                },
                select,
                populate: [{ path: 'projectId', select: 'nmae' }],
            });
            if (emailTemplate) {
                await EmailTemplateService.updateOneBy(
                    { _id: value._id },
                    value
                );
            } else {
                await EmailTemplateService.create(value);
            }
        }
        const emailTemplates = await EmailTemplateService.getTemplates(
            projectId
        );
        return sendItemResponse(req, res, emailTemplates);
    } catch (error) {
        sendErrorResponse(req, res, error);
    }
});

router.delete(
    '/:projectId/emailTemplate/:emailTemplateId',
    getUser,
    isUserOwner,
    async function(req, res) {
        try {
            const emailTemplateId = req.params.emailTemplateId;
            const userId = req.user.id;
            const emailTemplate = await EmailTemplateService.deleteBy(
                { _id: emailTemplateId },
                userId
            );
            return sendItemResponse(req, res, emailTemplate);
        } catch (error) {
            return sendErrorResponse(req, res, error);
        }
    }
);

module.exports = router;
