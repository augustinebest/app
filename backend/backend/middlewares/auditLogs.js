const url = require('url');
const _ = require('lodash');
const isValidMongoObjectId = require('../config/db').Types.ObjectId.isValid;

const AuditLogsService = require('../services/auditLogsService');
const ErrorService = require('../services/errorService');
const sendErrorResponse = require('./response').sendErrorResponse;
const { getProjectId } = require('./api');
const GlobalConfigService = require('../services/globalConfigService');

// TODO: This should be stored in a shared cache like redis.
let shouldStoreLogs = null;

module.exports = {
    log: async function(req, res, next) {
        try {
            const blackListedRoutes = ['/audit-logs/'];
            const blackListedReqObjectPaths = ['body.password'];
            const blackListedResObjectPaths = [];
            const blackListedResBodyObjectPaths = [
                'gitCredential',
                'dockerCredential',
                'iv',
            ];

            // Audit logging is attached to res 'finish' event, because of below reasons.
            //    - To get 'projectId' value if available. (Mostly passed as route parameter)
            //    - To access 'res.resBody' which is added in 'response' middlewares.
            //    - Also for some resason when run inside docker container only req.end and res.finish get emmited.
            res.on('finish', async () => {
                let userId = req.user && req.user.id ? req.user.id : null;
                userId = isValidMongoObjectId(userId) ? userId : null;

                let projectId = getProjectId(req, res);
                projectId = isValidMongoObjectId(projectId) ? projectId : null;

                if (shouldStoreLogs === null) {
                    const auditLogStatus = await GlobalConfigService.findOneBy({
                        query: { name: 'auditLogMonitoringStatus' },
                        select: 'value',
                    });

                    // check if the global config has auditLog flag and is storing logs before trying to store logs
                    shouldStoreLogs = !(
                        auditLogStatus && !auditLogStatus.value
                    );
                }

                //  skip storing if audit log config exist and it is not storing
                if (shouldStoreLogs) {
                    // store logs if storing
                    const parsedUrl = url.parse(req.originalUrl);

                    // Avoiding logging any audit data, if its a blacklisted url/route.
                    const isBlackListedRoute = blackListedRoutes.some(
                        blackListedRouteName => {
                            const fullApiUrl = req.originalUrl || '';
                            const paramsRouteUrl =
                                (req.route && req.route.path) || ''; // Ex. "/:projectId/statuspages"

                            return (
                                fullApiUrl.includes(blackListedRouteName) ||
                                paramsRouteUrl.includes(blackListedRouteName)
                            );
                        }
                    );

                    if (isBlackListedRoute) {
                        return;
                    }

                    // Removing specified blacklisted object paths for security and other reasons.
                    const modifiedReq = _.omit(
                        { ...req },
                        blackListedReqObjectPaths
                    );
                    const modifiedRes = _.omit(res, blackListedResObjectPaths);
                    if (Array.isArray(res.resBody)) {
                        modifiedRes.resBody = res.resBody.map(element =>
                            _.omit(element, blackListedResBodyObjectPaths)
                        );
                    }

                    const apiRequestDetails = {
                        apiSection: parsedUrl.pathname, // url path without any query strings.
                        apiUrl: modifiedReq.originalUrl,
                        protocol: modifiedReq.protocol,
                        hostname: modifiedReq.hostname,
                        port: modifiedReq.socket.address().port,
                        method: modifiedReq.method,
                        params: modifiedReq.params,
                        queries: modifiedReq.query,
                        body: modifiedReq.body || {},
                        headers: modifiedReq.headers,
                    };

                    const apiResponseDetails = {
                        statusCode: modifiedRes.statusCode,
                        statusMessage: modifiedRes.statusMessage,
                        resBody: modifiedRes.resBody || {},
                        headers: modifiedRes.getHeaders(),
                    };

                    await AuditLogsService.create({
                        userId: userId,
                        projectId: projectId,
                        request: apiRequestDetails,
                        response: apiResponseDetails,
                    });
                }
            });

            return next();
        } catch (error) {
            ErrorService.log('auditLogs.log', error);
            return sendErrorResponse(req, res, {
                code: 400,
                message: 'Error while logging the request.',
            });
        }
    },
};
