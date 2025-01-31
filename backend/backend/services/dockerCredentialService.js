const Crypto = require('crypto');
const DockerCredentialModel = require('../models/dockerCredential');
const { encrypt, decrypt } = require('../config/encryptDecrypt');
const axios = require('axios');
const handleSelect = require('../utils/select');
const handlePopulate = require('../utils/populate');

module.exports = {
    findBy: async function({ query, limit, skip, select, populate }) {
        if (!skip) skip = 0;

        if (!limit) limit = 0;

        if (typeof skip === 'string') skip = Number(skip);

        if (typeof limit === 'string') limit = Number(limit);

        if (!query) query = {};

        if (!query.deleted) query.deleted = false;

        let dockerCredentialQuery = DockerCredentialModel.find(query)
            .lean()
            .sort([['createdAt', -1]])
            .limit(limit)
            .skip(skip);
        dockerCredentialQuery = handleSelect(select, dockerCredentialQuery);
        dockerCredentialQuery = handlePopulate(populate, dockerCredentialQuery);

        const dockerCredentials = await dockerCredentialQuery;
        return dockerCredentials;
    },
    findOneBy: async function({ query, select, populate }) {
        if (!query) query = {};
        if (!query.deleted) query.deleted = false;

        let dockerCredentialQuery = DockerCredentialModel.findOne(query).lean();
        dockerCredentialQuery = handleSelect(select, dockerCredentialQuery);
        dockerCredentialQuery = handlePopulate(populate, dockerCredentialQuery);

        const dockerCredential = await dockerCredentialQuery;
        return dockerCredential;
    },
    create: async function(data) {
        // no more than one docker credential with the same details in a project
        const dockerCredential = await this.findOneBy({
            query: {
                dockerRegistryUrl: data.dockerRegistryUrl,
                projectId: data.projectId,
                dockerUsername: data.dockerUsername,
            },
            select: '_id',
        });

        if (dockerCredential) {
            const error = new Error(
                'Docker Credential already exist in this project'
            );
            error.code = 400;
            throw error;
        }

        const iv = Crypto.randomBytes(16);
        data.dockerPassword = await encrypt(data.dockerPassword, iv);
        data.iv = iv;

        const response = await DockerCredentialModel.create(data);
        return response;
    },
    updateOneBy: async function(query, data) {
        if (!query) query = {};

        if (!query.deleted) query.deleted = false;

        let dockerCredential = await this.findOneBy({
            query,
            select: 'dockerPassword iv',
        });

        if (!data.deleted && !data.deletedAt) {
            // validate docker username and password before update
            if (data.dockerPassword) {
                await this.validateDockerCredential({
                    username: data.dockerUsername,
                    password: data.dockerPassword,
                });
                const iv = Crypto.randomBytes(16);
                data.dockerPassword = await encrypt(data.dockerPassword, iv);
                data.iv = iv;
            } else {
                const password = await decrypt(
                    dockerCredential.dockerPassword,
                    dockerCredential.iv.buffer
                );
                await this.validateDockerCredential({
                    username: data.dockerUsername,
                    password,
                });
            }
        }

        dockerCredential = await DockerCredentialModel.findOneAndUpdate(
            query,
            {
                $set: data,
            },
            { new: true }
        );
        const populate = [{ path: 'projectId', select: 'name slug _id' }];
        const select =
            'dockerRegistryUrl dockerUsername dockerPassword iv projectId';
        dockerCredential = await this.findOneBy({
            query: {
                _id: dockerCredential._id,
                deleted: dockerCredential.deleted,
            },
            select,
            populate,
        });

        if (!dockerCredential) {
            const error = new Error(
                'Docker Credential not found or does not exist'
            );
            error.code = 400;
            throw error;
        }

        return dockerCredential;
    },
    deleteBy: async function(query) {
        let dockerCredential = await this.findOneBy({
            query,
            select: '_id',
        });

        if (!dockerCredential) {
            const error = new Error(
                'Docker Credential not found or does not exist'
            );
            error.code = 400;
            throw error;
        }

        dockerCredential = await this.updateOneBy(query, {
            deleted: true,
            deletedAt: Date.now(),
        });

        return dockerCredential;
    },
    hardDeleteBy: async function(query) {
        await DockerCredentialModel.deleteMany(query);
        return 'Docker credential(s) successfully deleted';
    },
    validateDockerCredential: async function({ username, password }) {
        try {
            // user docker api to check if username and password is valid
            const response = await axios.post(
                'https://hub.docker.com/v2/users/login',
                { username, password }
            );
            // response.data should contain a token
            return response.data;
        } catch (err) {
            // username or password was incorrect
            const error = new Error('Invalid docker credential');
            error.code = 400;
            throw error;
        }
    },
};
