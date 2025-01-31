const Mongoose = require('mongoose');
const mongoose = require('../config/db');
const JsonToCsv = require('./jsonToCsv');
const ObjectID = mongoose.Types.ObjectId;
const ErrorService = require('../services/errorService');
const logger = require('../config/logger');

function filterKeys(field) {
    field = field._doc ? field._doc : field;

    const filteredKeys = Object.keys(field).filter(
        key =>
            key !== '__v' &&
            key !== 'deleted' &&
            key !== 'deletedAt' &&
            key !== 'deletedById'
    );

    const filteredField = filteredKeys.reduce((resultField, key) => {
        if (isObjectID(field[key])) {
            resultField[key] = field[key].toString();
        } else if (Array.isArray(field[key])) {
            resultField[key] = field[key].map(value =>
                typeof value === 'object' &&
                value !== null &&
                value.__v !== null
                    ? isDate(field[key])
                        ? field[key]
                        : filterKeys(value)
                    : value
            );
        } else if (
            typeof field[key] === 'object' &&
            field[key] !== null &&
            field[key].__v !== null
        ) {
            resultField[key] = isDate(field[key])
                ? field[key]
                : filterKeys(field[key]);
        } else {
            resultField[key] = field[key];
        }
        return resultField;
    }, {});

    return filteredField;
}

function isObjectID(id) {
    try {
        if (ObjectID.isValid(id)) {
            if (new ObjectID(id) === id) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

function isDate(date) {
    try {
        typeof date === 'object' &&
            date !== null &&
            new Date(date).toISOString();
        return true;
    } catch (error) {
        return false;
    }
}

function logResponse(req, res, responsebody) {
    const requestEndedAt = Date.now();
    const method = req.method;
    const url = req.url;

    const duration_info = `OUTGOING RESPONSE ID: ${req.id} -- POD NAME: ${
        process.env.POD_NAME
    } -- METHOD: ${method} -- URL: ${url} -- DURATION: ${requestEndedAt -
        req.requestStartedAt}ms -- STATUS: ${res.statusCode}`;

    const body_info = `OUTGOING RESPONSE ID: ${req.id} -- RESPONSE BODY: ${
        responsebody ? JSON.stringify(responsebody, null, 2) : 'EMPTY'
    }`;

    if (res.statusCode > 299) {
        logger.error(duration_info);
        logger.error(body_info);
    } else {
        logger.info(duration_info);
        logger.info(body_info);
    }
}

module.exports = {
    sendEmptyResponse(req, res) {
        res.set('Request-Id', req.id);
        res.set('Pod-Id', process.env.POD_NAME);

        res.status(200).send();
        return logResponse(req, res);
    },

    sendFileResponse(req, res, file) {
        /** create read stream */

        const gfs = new Mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads',
        });

        const readstream = gfs.openDownloadStreamByName(file.filename);

        /** set the proper content type */
        res.set('Content-Type', file.contentType);
        res.set('Request-Id', req.id);
        res.set('Pod-Id', process.env.POD_NAME);

        res.status(200);
        /** return response */
        readstream.pipe(res);

        return logResponse(req, res, 'FILE');
    },

    sendErrorResponse: function(req, res, error) {
        let status, message;
        if (error.statusCode && error.message) {
            res.resBody = { message: error.message }; // To be used in 'auditLog' middleware to log reponse data;
            status = error.statusCode;
            message = error.message;
        } else if (
            error.code &&
            error.message &&
            typeof error.code === 'number'
        ) {
            status = error.code;
            if (
                error.code &&
                error.status &&
                typeof error.code === 'number' &&
                typeof error.status === 'number' &&
                error.code > 600
            ) {
                status = error.status;
            }
            res.resBody = { message: error.message };
            message = error.message;
        } else if (error instanceof mongoose.Error.CastError) {
            res.resBody = { code: 400, message: 'Input data schema mismatch.' };
            status = 400;
            message = 'Input data schema mismatch';
        } else {
            res.resBody = { message: 'Server Error.' };
            status = 500;
            message = 'Server Error.';
        }

        if (!req.logdata) {
            req.logdata = {};
        }

        req.logdata.errorCode = status;
        ErrorService.log('sendErrorResponse', message, req.logdata);

        res.set('Request-Id', req.id);
        res.set('Pod-Id', process.env.POD_NAME);

        res.status(status).send({ message });
        return logResponse(req, res, { message });
    },

    sendListResponse: async function(req, res, list, count) {
        // remove __v, deleted, deletedAt and deletedById if not Master Admin
        if (req.authorizationType !== 'MASTER-ADMIN') {
            if (Array.isArray(list)) {
                list = list.map(field =>
                    typeof field === 'object' && field !== null
                        ? filterKeys(field)
                        : field
                );
            } else if (typeof list === 'object' && list !== null) {
                list = filterKeys(list);
            }
        }

        const response = {};

        if (!list) {
            list = [];
        }

        if (list) {
            response.data = list;
        }

        if (count) {
            response.count = count;
        } else {
            if (list) response.count = list.length;
        }

        if (req.query.skip) {
            response.skip = parseInt(req.query.skip);
        }

        if (req.query.limit) {
            response.limit = parseInt(req.query.limit);
        }

        //purge request.
        //req = null;
        if (req.query['output-type'] === 'csv') {
            if (!Array.isArray(response.data)) {
                const properties = Object.keys(response.data);
                const newObj = {};
                properties.forEach(prop => {
                    if (
                        typeof response.data[[prop]] === 'object' &&
                        response.data[[prop]] !== null
                    ) {
                        if (response.data[[prop]].name)
                            response.data[[prop]] = response.data[[prop]].name;
                        else if (response.data[[prop]].title)
                            response.data[[prop]] = response.data[[prop]].title;
                        else if (response.data[[prop]]._id)
                            response.data[[prop]] = response.data[[prop]]._id;
                    }
                    newObj[[prop]] = response.data[[prop]];
                });
                response.data = JSON.parse(JSON.stringify(newObj));
                response.data = [response.data];
            } else {
                response.data = response.data.map(i => {
                    i = i._doc ? i._doc : i;
                    const properties = Object.keys(i);
                    const newObj = {};
                    properties.forEach(prop => {
                        if (
                            typeof i[[prop]] === 'object' &&
                            i[[prop]] !== null
                        ) {
                            if (i[[prop]].name) i[[prop]] = i[[prop]].name;
                            else if (i[[prop]].title)
                                i[[prop]] = i[[prop]].title;
                            else if (i[[prop]]._id) i[[prop]] = i[[prop]]._id;
                        }
                        newObj[[prop]] = i[[prop]];
                    });
                    return JSON.parse(JSON.stringify(newObj));
                });
            }

            response.data = await JsonToCsv.ToCsv(response.data);
        }

        res.resBody = response; // To be used in 'auditLog' middleware to log reponse data;
        res.set('Request-Id', req.id);
        res.set('Pod-Id', process.env.POD_NAME);
        res.status(200).send(response);

        return logResponse(req, res, response);
    },

    async sendItemResponse(req, res, item) {
        // remove __v, deleted, deletedAt and deletedById if not Master Admin
        if (req.authorizationType !== 'MASTER-ADMIN') {
            if (Array.isArray(item)) {
                item = item.map(field =>
                    typeof field === 'object' && field !== null
                        ? filterKeys(field)
                        : field
                );
            } else if (typeof list === 'object' && item !== null) {
                item = filterKeys(item);
            }
        }

        if (req.query['output-type'] === 'csv') {
            if (!Array.isArray(item)) {
                const properties = Object.keys(item);
                const newObj = {};
                properties.forEach(prop => {
                    if (
                        typeof item[[prop]] === 'object' &&
                        item[[prop]] !== null
                    ) {
                        if (item[[prop]].name) item[[prop]] = item[[prop]].name;
                        else if (item[[prop]].title)
                            item[[prop]] = item[[prop]].title;
                        else if (item[[prop]]._id)
                            item[[prop]] = item[[prop]]._id;
                    }
                    newObj[[prop]] = item[[prop]];
                });
                item = JSON.parse(JSON.stringify(newObj));
                item = [item];
            } else {
                item = item.map(i => {
                    i = i._doc ? i._doc : i;
                    const properties = Object.keys(i);
                    const newObj = {};
                    properties.forEach(prop => {
                        if (
                            typeof i[[prop]] === 'object' &&
                            i[[prop]] !== null
                        ) {
                            if (i[[prop]].name) i[[prop]] = i[[prop]].name;
                            else if (i[[prop]].title)
                                i[[prop]] = i[[prop]].title;
                            else if (i[[prop]]._id) i[[prop]] = i[[prop]]._id;
                        }
                        newObj[[prop]] = i[[prop]];
                    });
                    return JSON.parse(JSON.stringify(newObj));
                });
            }
            item = await JsonToCsv.ToCsv(item);
        }

        res.resBody = item; // To be used in 'auditLog' middleware to log reponse data;

        res.set('Request-Id', req.id);
        res.set('Pod-Id', process.env.POD_NAME);

        res.status(200).send(item);

        return logResponse(req, res, item);
    },
};
