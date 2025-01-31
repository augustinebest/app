const apiMiddleware = require('./api');
const SendErrorResponse = require('../middlewares/response').sendErrorResponse;

const doesUserBelongToProject = require('./project').doesUserBelongToProject;

module.exports = {
    // Description: Checking if user is authorized to access the page and decode jwt to get user data.
    // Params:
    // Param 1: req.headers -> {token}
    // Returns: 400: User is unauthorized since unauthorized token was present.
    isAuthorized: function(req, res, next) {
        const projectId = apiMiddleware.getProjectId(req);

        if (projectId) {
            if (!apiMiddleware.isValidProjectId(projectId)) {
                return SendErrorResponse(req, res, {
                    message: 'Project Id is not valid',
                    code: 400,
                });
            }

            if (apiMiddleware.hasAPIKey(req)) {
                return apiMiddleware.isValidProjectIdAndApiKey(req, res, next);
            }
        }

        doesUserBelongToProject(req, res, next);
    },
};
