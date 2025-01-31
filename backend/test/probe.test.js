process.env.PORT = 3020;
const expect = require('chai').expect;
const chai = require('chai');
chai.use(require('chai-http'));
chai.use(require('chai-subset'));
const app = require('../server');
const userData = require('./data/user');
const { newProject } = require('./data/project');
const gitCredential = require('./data/gitCredential');
const dockerCredential = require('./data/dockerCredential');
const { createUser } = require('./utils/userSignUp');
const VerificationTokenModel = require('../backend/models/verificationToken');
const UserService = require('../backend/services/userService');
const ProjectService = require('../backend/services/projectService');
const request = chai.request.agent(app);
const ProbeService = require('../backend/services/probeService');
const MonitorService = require('../backend/services/monitorService');
const ComponentService = require('../backend/services/componentService');
const GitCredentialService = require('../backend/services/gitCredentialService');
const ApplicationSecurityService = require('../backend/services/applicationSecurityService');
const DockerCredentialService = require('../backend/services/dockerCredentialService');
const ContainerSecurityService = require('../backend/services/containerSecurityService');
let probeId;
const GlobalConfig = require('./utils/globalConfig');
const AirtableService = require('../backend/services/airtableService');
let token, userId, projectId, componentId;
const probeKey = 'test-key';
const sleep = waitTimeInMs =>
    new Promise(resolve => setTimeout(resolve, waitTimeInMs));
const generateRandomString = require('./utils/string').generateRandomString;
const probeServerRequestHeader = ({ probeName, probeKey, clusterKey }) => ({
    'Access-Control-Allow-Origin': '*',
    Accept: 'application/json',
    'Content-Type': 'application/json;charset=UTF-8',
    probeName,
    probeKey,
    clusterKey,
});
let probeServerName1, probeServerName2;

describe('Probe API', function() {
    this.timeout(20000);

    before(async function() {
        this.timeout(40000);
        await GlobalConfig.initTestConfig();
        // remove every monitor in DB
        await MonitorService.hardDeleteBy({});

        const user = await UserService.create({
            ...userData.user,
            role: 'master-admin',
        });

        const project = await ProjectService.create({
            name: 'New Test Project',
            userId: user._id,
            stripePlanId: newProject.stripePlanId,
            stripeSubscriptionId: newProject.stripeSubscriptionId,
        });
        projectId = project._id;

        const component = await ComponentService.create({
            name: 'New Test Component',
            projectId,
        });
        componentId = component._id;

        const response = await request.post('/user/login').send({
            email: userData.user.email,
            password: userData.user.password,
        });

        token = response.body.tokens.jwtAccessToken;
        return Promise.resolve();
    });

    after(async function() {
        await GlobalConfig.removeTestConfig();
        await ProbeService.hardDeleteBy({ _id: probeId });
        await ProjectService.hardDeleteBy({ _id: projectId });
        await UserService.hardDeleteBy({
            email: {
                $in: [
                    userData.user.email,
                    userData.newUser.email,
                    userData.anotherUser.email,
                ],
            },
        });
        await ComponentService.hardDeleteBy({ _id: componentId });
        await GitCredentialService.hardDeleteBy({ projectId });
        await ApplicationSecurityService.hardDelete({ componentId });
        await DockerCredentialService.hardDeleteBy({ projectId });
        await ContainerSecurityService.hardDelete({ componentId });
        await ProbeService.hardDeleteBy({
            probeName: {
                $in: [probeServerName1, probeServerName2],
            },
        });
        await AirtableService.deleteAll({ tableName: 'User' });
    });

    it('should add a probe by admin', function(done) {
        const authorization = `Basic ${token}`;
        const probeName = generateRandomString();
        request
            .post('/probe/')
            .set('Authorization', authorization)
            .send({
                probeName: probeName,
                probeKey: probeKey,
            })
            .end(function(err, res) {
                probeId = res.body._id;
                expect(res).to.have.status(200);
                expect(res.body.probeName).to.be.equal(probeName);
                done();
            });
    });

    it('should not add a probe if not admin', function(done) {
        const probeName = generateRandomString();
        createUser(request, userData.newUser, function(err, res) {
            userId = res.body.id;
            VerificationTokenModel.findOne({ userId }, function(
                err,
                verificationToken
            ) {
                request
                    .get(`/user/confirmation/${verificationToken.token}`)
                    .redirects(0)
                    .end(function() {
                        request
                            .post('/user/login')
                            .send({
                                email: userData.newUser.email,
                                password: userData.newUser.password,
                            })
                            .end(function(err, res) {
                                const authorization = `Basic ${res.body.tokens.jwtAccessToken}`;
                                request
                                    .post('/probe/')
                                    .set('Authorization', authorization)
                                    .send({
                                        probeName: probeName,
                                        probeKey: '',
                                    })
                                    .end(function(err, res) {
                                        expect(res).to.have.status(400);
                                        done();
                                    });
                            });
                    });
            });
        });
    });

    it('should reject a probe if same name already exists', function(done) {
        const authorization = `Basic ${token}`;
        const probeName = generateRandomString();
        request
            .post('/probe/')
            .set('Authorization', authorization)
            .send({
                probeName: probeName,
                probeKey: probeKey,
            })
            .end(function(err, res) {
                expect(res).to.have.status(200);
                request
                    .post('/probe/')
                    .set('Authorization', authorization)
                    .send({
                        probeName: probeName,
                        probeKey: probeKey,
                    })
                    .end(function(err, res) {
                        expect(res).to.have.status(400);
                        done();
                    });
            });
    });

    it('should get probes', function(done) {
        const authorization = `Basic ${token}`;
        request
            .get('/probe/')
            .set('Authorization', authorization)
            .send()
            .end(function(err, res) {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('should delete a probe by admin', function(done) {
        const authorization = `Basic ${token}`;
        const probeName = generateRandomString();
        request
            .post('/probe/')
            .set('Authorization', authorization)
            .send({
                probeName: probeName,
                probeKey: probeKey,
            })
            .end(function(err, res) {
                probeId = res.body._id;
                expect(res).to.have.status(200);
                request
                    .delete(`/probe/${probeId}`)
                    .set('Authorization', authorization)
                    .send()
                    .end(function(err, res) {
                        expect(res).to.have.status(200);
                        done();
                    });
            });
    });

    it('should add to the database the unknown probe servers requesting the list of monitor to ping.', async function() {
        probeServerName1 = generateRandomString();
        const res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName1,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        const probe = await ProbeService.findOneBy({
            query: { probeName: probeServerName1 },
            select: '_id',
        });
        expect(probe).to.not.eql(null);
    });

    it('should return the list of monitors of type "server-monitor" only time for one probe server during an interval of 1 min ', async function() {
        this.timeout(100000);
        const monitor = await MonitorService.create({
            projectId,
            componentId,
            name: generateRandomString(),
            type: 'server-monitor',
        });
        //create a second probe server.
        probeServerName2 = generateRandomString();
        let res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName2,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(1);

        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName1,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(0);

        await sleep(30000);
        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName1,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(0);

        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName2,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(0);

        await sleep(35000);
        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName1,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(1);

        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName2,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(0);

        //Deleting the monitor is necessary for the results of the next tests
        await MonitorService.hardDeleteBy({ _id: monitor._id });
    });

    it('should return the list of monitors of type "url" only 1 time for every probe server during an interval of 1 min', async function() {
        this.timeout(100000);
        const monitor = await MonitorService.create({
            projectId,
            componentId,
            name: generateRandomString(),
            type: 'url',
            data: {
                url: 'https://hackerbay.io',
            },
        });

        let res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName1,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(1);

        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName2,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(1);

        await sleep(30000);
        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName1,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(0);

        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName2,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(0);

        await sleep(35000);
        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName1,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(1);

        res = await request.get('/probe/monitors').set(
            probeServerRequestHeader({
                probeName: probeServerName2,
                probeKey,
                clusterKey: process.env.CLUSTER_KEY,
            })
        );
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.count).to.equal(1);

        await MonitorService.hardDeleteBy({ _id: monitor._id });
    });

    it('should get application securities yet to be scanned or scanned 24hrs ago', function(done) {
        const authorization = `Basic ${token}`;
        const probeName = 'US';
        const probeKey = '33b674ca-9fdd-11e9-a2a3-2a2ae2dbccez';
        const clusterKey = 'f414c23b4cdf4e84a6a66ecfd528eff2';

        GitCredentialService.create({
            gitUsername: gitCredential.gitUsername,
            gitPassword: gitCredential.gitPassword,
            projectId,
        }).then(function(credential) {
            const data = {
                name: 'Test',
                gitRepositoryUrl: gitCredential.gitRepositoryUrl,
                gitCredential: credential._id,
            };

            request
                .post(`/security/${projectId}/${componentId}/application`)
                .set('Authorization', authorization)
                .send(data)
                .end(function() {
                    request
                        .get('/probe/applicationSecurities')
                        .set({
                            probeName,
                            probeKey,
                            clusterKey,
                        })
                        .end(function(err, res) {
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.an('array');
                            done();
                        });
                });
        });
    });

    it('should get container securities yet to be scanned or scanned 24hrs ago', function(done) {
        const authorization = `Basic ${token}`;
        const probeName = 'US';
        const probeKey = '33b674ca-9fdd-11e9-a2a3-2a2ae2dbccez';
        const clusterKey = 'f414c23b4cdf4e84a6a66ecfd528eff2';

        DockerCredentialService.create({
            dockerRegistryUrl: dockerCredential.dockerRegistryUrl,
            dockerUsername: dockerCredential.dockerUsername,
            dockerPassword: dockerCredential.dockerPassword,
            projectId,
        }).then(function(credential) {
            const data = {
                name: 'Test',
                dockerCredential: credential._id,
                imagePath: dockerCredential.imagePath,
                imageTags: dockerCredential.imageTags,
            };

            request
                .post(`/security/${projectId}/${componentId}/container`)
                .set('Authorization', authorization)
                .send(data)
                .end(function() {
                    request
                        .get('/probe/containerSecurities')
                        .set({
                            probeName,
                            probeKey,
                            clusterKey,
                        })
                        .end(function(err, res) {
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.an('array');
                            done();
                        });
                });
        });
    });
});
