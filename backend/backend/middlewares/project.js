const ProjectService = require('../services/projectService');
const ErrorService = require('../services/errorService');
const url = require('url');
const sendErrorResponse = require('../middlewares/response').sendErrorResponse;
const apiMiddleware = require('../middlewares/api');

module.exports = {
    // Description: Checks if user belongs to the project.
    //
    // Params:
    // Param 1: req.params-> {projectId}; req.user-> {id}
    // Returns: 400: Project does not exist or User is not present in this project; 500: Server Error
    doesUserBelongToProject: async function(req, res, next) {
        try {
            // authorize if user is master-admin
            if (req.authorizationType === 'MASTER-ADMIN') {
                return next();
            } else {
                const userId = req.user
                    ? req.user.id
                    : null || url.parse(req.url, true).query.userId;
                const projectId =
                    req.params.projectId ||
                    req.body.projectId ||
                    url.parse(req.url, true).query.projectId;
                //sanitize
                if (!projectId) {
                    return sendErrorResponse(req, res, {
                        code: 400,
                        message: 'Project id is not present.',
                    });
                }
                // Calls the ProjectService
                const project = await ProjectService.findOneBy({
                    query: { _id: projectId },
                    select: '_id users',
                });

                let isUserPresentInProject = false;

                if (project) {
                    const projectUsers = project.users;

                    for (let i = 0; i < projectUsers.length; i++) {
                        if (projectUsers[i].userId === userId) {
                            isUserPresentInProject = true;
                            return next();
                        }
                    }

                    // if not in project, look at subprojects.

                    const subProjects = await ProjectService.findBy({
                        query: { parentProjectId: project._id },
                        select: 'users _id',
                    });

                    if (subProjects && subProjects.length > 0) {
                        for (const subProject of subProjects) {
                            // 'for in' iterate over the keys while 'for of' iterate over the values
                            const subProjectUsers = subProject.users; // Using 'for in' made subProject.users === undefined

                            for (let i = 0; i < subProjectUsers.length; i++) {
                                if (subProjectUsers[i].userId === userId) {
                                    isUserPresentInProject = true;
                                    return next();
                                }
                            }
                        }
                    }
                } else {
                    return sendErrorResponse(req, res, {
                        code: 400,
                        message: 'Project does not exist.',
                    });
                }

                if (isUserPresentInProject) {
                    return next();
                } else {
                    return sendErrorResponse(req, res, {
                        code: 400,
                        message: 'You are not present in this project.',
                    });
                }
            }
        } catch (error) {
            ErrorService.log('project.doesUserBelongToProject', error);
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Bad request to server',
            });
        }
    },

    // Description: Checks if user is admin.
    //
    // Params:
    // Param 1: req.params-> {projectId}; req.user-> {id}
    // Returns: 400: You are not authorized to add member to project. Only admin can add.; 500: Server Error
    isUserAdmin: async function(req, res, next) {
        try {
            const projectId = apiMiddleware.getProjectId(req);

            if (projectId) {
                if (!apiMiddleware.isValidProjectId(projectId)) {
                    return sendErrorResponse(req, res, {
                        message: 'Project Id is not valid',
                        code: 400,
                    });
                }

                if (apiMiddleware.hasAPIKey(req)) {
                    return apiMiddleware.isValidProjectIdAndApiKey(
                        req,
                        res,
                        next
                    );
                }
            }

            // authorize if user is master-admin
            //
            if (req.authorizationType === 'MASTER-ADMIN') {
                return next();
            } else {
                const userId = req.user ? req.user.id : null;
                const project = await ProjectService.findOneBy({
                    query: {
                        'users.userId': userId,
                        _id: req.params.projectId,
                    },
                    select: 'users',
                });
                if (project) {
                    let role;
                    for (const user of project.users) {
                        if (user.userId === userId) {
                            role = user.role;
                            break;
                        }
                    }
                    if (role !== 'Administrator' && role !== 'Owner') {
                        return sendErrorResponse(req, res, {
                            code: 400,
                            message:
                                "You cannot edit the project because you're not an admin.",
                        });
                    } else {
                        return next();
                    }
                } else {
                    return sendErrorResponse(req, res, {
                        code: 400,
                        message: "You're not authorized.",
                    });
                }
            }
        } catch (error) {
            ErrorService.log('project.isUserAdmin', error);
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Bad request to server',
            });
        }
    },

    isUserOwner: async function(req, res, next) {
        try {
            // authorize if user is master-admin
            if (req.authorizationType === 'MASTER-ADMIN') {
                return next();
            } else {
                const UserId = req.user ? req.user.id : null;
                const project = await ProjectService.findOneBy({
                    query: {
                        'users.userId': UserId,
                        _id: req.params.projectId,
                    },
                    select: 'users',
                });
                if (project) {
                    let role;
                    for (const user of project.users) {
                        if (user.userId === UserId) {
                            role = user.role;
                            break;
                        }
                    }
                    if (role !== 'Owner') {
                        return sendErrorResponse(req, res, {
                            code: 400,
                            message:
                                "You cannot edit the project because you're not an owner.",
                        });
                    } else {
                        return next();
                    }
                } else {
                    return sendErrorResponse(req, res, {
                        code: 400,
                        message: "You're not authorized.",
                    });
                }
            }
        } catch (error) {
            ErrorService.log('project.isUserOwner', error);
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Bad request to server',
            });
        }
    },
};
