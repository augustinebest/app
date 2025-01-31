process.env.PORT = 3020;
const expect = require('chai').expect;
const userData = require('./data/user');
const chai = require('chai');
chai.use(require('chai-http'));
const app = require('../server');

const request = chai.request.agent(app);
const { createUser } = require('./utils/userSignUp');
const UserService = require('../backend/services/userService');
const AirtableService = require('../backend/services/airtableService');
const GlobalConfig = require('./utils/globalConfig');
const VerificationTokenModel = require('../backend/models/verificationToken');
const SsoService = require('../backend/services/ssoService');
const ProjectService = require('../backend/services/projectService');

const ssoObject = {
    'saml-enable': true,
    domain: 'hackerbay.com',
    samlSsoUrl: 'hackerbay.com/login',
    certificateFingerprint: 'azertyuiop',
    remoteLogoutUrl: 'hackerbay.com/logout',
    ipRanges: '127.0.0.1',
};

let token, userId;

describe('SSO API', function() {
    this.timeout(300000);

    before(function(done) {
        this.timeout(40000);
        GlobalConfig.initTestConfig().then(function() {
            createUser(request, userData.adminUser, function(err, res) {
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
                                    email: userData.adminUser.email,
                                    password: userData.adminUser.password,
                                })
                                .end(function(err, res) {
                                    token = res.body.tokens.jwtAccessToken;
                                    UserService.updateBy(
                                        { _id: userId },
                                        { role: 'master-admin' }
                                    ).then(function() {
                                        done();
                                    });
                                });
                        });
                });
            });
        });
    });

    after(async function() {
        await GlobalConfig.removeTestConfig();
        await ProjectService.hardDeleteBy({ 'users.userId': userId });
        await UserService.hardDeleteBy({
            email: {
                $in: [
                    userData.adminUser.email,
                    userData.user.email,
                    userData.newUser.email,
                    userData.anotherUser.email,
                ],
            },
        });
        await AirtableService.deleteAll({ tableName: 'User' });
    });

    describe('should reject requests from an unauthenticated users', function() {
        it('should reject GET requests', function(done) {
            request.get('/sso').end(function(err, res) {
                expect(res).to.have.status(401);
                done();
            });
        });
        it('should reject POST requests', function(done) {
            request.post('/sso').end(function(err, res) {
                expect(res).to.have.status(401);
                done();
            });
        });
        it('should reject PUT requests', function(done) {
            request
                .put('/sso/5ea951228877984ea9f47660')
                .end(function(err, res) {
                    expect(res).to.have.status(401);
                    done();
                });
        });
        it('should reject DELETE requests', function(done) {
            request
                .delete('/sso/5ea951228877984ea9f47660')
                .end(function(err, res) {
                    expect(res).to.have.status(401);
                    done();
                });
        });
    });

    describe('GET /sso/', function() {
        it('should return SSOs list with count', function(done) {
            const authorization = `Basic ${token}`;
            request
                .get('/sso')
                .set('Authorization', authorization)
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('data');
                    expect(res.body).to.have.property('count');
                    done();
                });
        });
        it('should return SSOs list with count, skip and limit (when skip&limit specified)', function(done) {
            const authorization = `Basic ${token}`;
            request
                .get('/sso?limit=10&skip=0')
                .set('Authorization', authorization)
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('data');
                    expect(res.body).to.have.property('count');
                    expect(res.body).to.have.property('limit');
                    expect(res.body).to.have.property('skip');
                    done();
                });
        });
    });
    describe('POST /sso', function() {
        it('should create a new SSO', function(done) {
            const authorization = `Basic ${token}`;
            request
                .post('/sso')
                .set('Authorization', authorization)
                .send(ssoObject)
                .end(async function(err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('_id');
                    expect(res.body).to.have.property('domain');
                    expect(res.body).to.have.property('samlSsoUrl');
                    expect(res.body).to.have.property('remoteLogoutUrl');

                    const sso = await SsoService.findOneBy({
                        query: { _id: res.body._id },
                        select: ' _id domain samlUrl remoteLogoutUrl',
                    });
                    expect(sso).to.be.an('object');
                    expect(sso).to.have.property('_id');
                    expect(sso).to.have.property('domain');
                    expect(sso).to.have.property('samlSsoUrl');
                    expect(sso).to.have.property('remoteLogoutUrl');

                    await SsoService.hardDeleteBy({ _id: res.body._id });
                    done();
                });
        });

        it('should not create a new SSO if domaine is not defined', function(done) {
            const authorization = `Basic ${token}`;
            const payload = { ...ssoObject };
            delete payload.domain;

            request
                .post('/sso')
                .set('Authorization', authorization)
                .send(payload)
                .end(function(err, res) {
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it('should not create a new SSO if Saml SSO url is not defined', function(done) {
            const authorization = `Basic ${token}`;
            const payload = { ...ssoObject };
            delete payload.samlSsoUrl;

            request
                .post('/sso')
                .set('Authorization', authorization)
                .send(payload)
                .end(function(err, res) {
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it('should not create a new SSO if remote logout url is not defined', function(done) {
            const authorization = `Basic ${token}`;
            const payload = { ...ssoObject };
            delete payload.remoteLogoutUrl;

            request
                .post('/sso')
                .set('Authorization', authorization)
                .send(payload)
                .end(function(err, res) {
                    expect(res).to.have.status(400);
                    done();
                });
        });
    });

    describe('DELETE /sso', function() {
        it('should delete sso', function(done) {
            const authorization = `Basic ${token}`;
            SsoService.create(ssoObject).then(sso => {
                const { _id: ssoId } = sso;
                request
                    .delete(`/sso/${ssoId}`)
                    .set('Authorization', authorization)
                    .end(async function(err, res) {
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.property('_id');
                        expect(res.body).to.have.property('domain');
                        expect(res.body).to.have.property('samlSsoUrl');
                        expect(res.body).to.have.property('remoteLogoutUrl');
                        const deletedSso = await SsoService.findOneBy({
                            query: { _id: res.body._id, deleted: true },
                            select: 'deleted',
                        });

                        expect(deletedSso).to.be.an('object');
                        expect(deletedSso.deleted).to.equal(true);

                        SsoService.hardDeleteBy({ _id: res.body._id });
                        done();
                    });
            });
        });
    });

    describe('UPDATE /sso', function() {
        it('should update SSO', function(done) {
            const authorization = `Basic ${token}`;
            SsoService.create(ssoObject).then(sso => {
                const { _id: ssoId } = sso;
                const updatedSsoObject = { ...ssoObject };
                updatedSsoObject.domain = 'updated.hackerbay.com';
                updatedSsoObject.samlSsoUrl = 'updated.hackerbay.com/login';
                updatedSsoObject.remoteLogoutUrl =
                    'updated.hackerbay.com/logout';
                request
                    .put(`/sso/${ssoId}`)
                    .set('Authorization', authorization)
                    .send(updatedSsoObject)
                    .end(async function(err, res) {
                        expect(res).to.have.status(200);
                        expect(res.body[0]).to.be.an('object');
                        expect(res.body[0].domain).to.equal(
                            updatedSsoObject.domain
                        );

                        const sso = await SsoService.findOneBy({
                            query: { _id: ssoId },
                            select: 'domain samlSsoUrl remoteLogoutUrl ',
                        });
                        expect(sso.domain).to.equal(updatedSsoObject.domain);
                        expect(sso.samlSsoUrl).to.equal(
                            updatedSsoObject.samlSsoUrl
                        );
                        expect(sso.remoteLogoutUrl).to.equal(
                            updatedSsoObject.remoteLogoutUrl
                        );

                        await SsoService.hardDeleteBy({ _id: ssoId });
                        done();
                    });
            });
        });
    });
});
