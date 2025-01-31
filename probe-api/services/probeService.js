module.exports = {
    create: async function(data) {
        try {
            const _this = this;
            let probeKey;
            if (data.probeKey) {
                probeKey = data.probeKey;
            } else {
                probeKey = uuidv1();
            }
            const storedProbe = await _this.findOneBy({
                probeName: data.probeName,
            });
            if (storedProbe && storedProbe.probeName) {
                const error = new Error('Probe name already exists.');
                error.code = 400;
                ErrorService.log('probe.create', error);
                throw error;
            } else {
                const probe = {};
                probe.probeKey = probeKey;
                probe.probeName = data.probeName;
                probe.version = data.probeVersion;

                const now = new Date(moment().format());
                probe.createdAt = now;
                probe.lastAlive = now;
                probe.deleted = false;

                const result = await probeCollection.insertOne(probe);
                const savedProbe = await _this.findOneBy({
                    _id: ObjectId(result.insertedId),
                });
                return savedProbe;
            }
        } catch (error) {
            ErrorService.log('ProbeService.create', error);
            throw error;
        }
    },

    findOneBy: async function(query) {
        try {
            if (!query) {
                query = {};
            }

            if (!query.deleted)
                query.$or = [
                    { deleted: false },
                    { deleted: { $exists: false } },
                ];

            const probe = await probeCollection.findOne(query);
            return probe;
        } catch (error) {
            ErrorService.log('ProbeService.findOneBy', error);
            throw error;
        }
    },

    updateOneBy: async function(query, data) {
        try {
            if (!query) {
                query = {};
            }

            if (!query.deleted)
                query.$or = [
                    { deleted: false },
                    { deleted: { $exists: false } },
                ];

            await probeCollection.updateOne(query, { $set: data });
            const probe = await this.findOneBy(query);
            return probe;
        } catch (error) {
            ErrorService.log('ProbeService.updateOneBy', error);
            throw error;
        }
    },

    updateProbeStatus: async function(probeId) {
        try {
            const now = new Date(moment().format());
            await probeCollection.updateOne(
                {
                    _id: ObjectId(probeId),
                    $or: [{ deleted: false }, { deleted: { $exists: false } }],
                },
                { $set: { lastAlive: now } }
            );
            const probe = await this.findOneBy({
                _id: ObjectId(probeId),
            });

            // realtime update for probe
            postApi(
                `${realtimeBaseUrl}/update-probe`,
                { data: probe },
                true
            ).catch(error => {
                ErrorService.log('probeService.updateProbeStatus', error);
            });
            return probe;
        } catch (error) {
            ErrorService.log('probeService.updateProbeStatus', error);
            throw error;
        }
    },
};

const ErrorService = require('./errorService');
const moment = require('moment');
const { ObjectId } = require('mongodb');
const probeCollection = global.db.collection('probes');
const { v1: uuidv1 } = require('uuid');
const { postApi } = require('../utils/api');
const { realtimeUrl } = require('../utils/config');
const realtimeBaseUrl = `${realtimeUrl}/realtime`;
