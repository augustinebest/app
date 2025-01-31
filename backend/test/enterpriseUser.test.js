process.env.PORT = 3020;
const expect = require('chai').expect;
const data = require('./data/user');
const chai = require('chai');
chai.use(require('chai-http'));
const app = require('../server');
const GlobalConfig = require('./utils/globalConfig');
const request = chai.request.agent(app);
const { createEnterpriseUser } = require('./utils/userSignUp');
const UserService = require('../backend/services/userService');
const ProjectService = require('../backend/services/projectService');

let projectId, newProjectId, userRole, token;

describe('Enterprise User API', function() {
    this.timeout(20000);

    before(function(done) {
        this.timeout(40000);
        GlobalConfig.initTestConfig().then(function() {
            createEnterpriseUser(request, data.user, function(err, res) {
                const project = res.body.project;
                projectId = project._id;
                userRole = res.body.role;

                request
                    .post('/user/login')
                    .send({
                        email: data.user.email,
                        password: data.user.password,
                    })
                    .end(function(err, res) {
                        token = res.body.tokens.jwtAccessToken;
                        done();
                    });
            });
        });
    });

    after(async () => {
        await GlobalConfig.removeTestConfig();
        await UserService.hardDeleteBy({
            email: {
                $in: [
                    data.user.email.toLowerCase(),
                    data.newUser.email.toLowerCase(),
                ],
            },
        });
        await ProjectService.hardDeleteBy({
            _id: { $in: [projectId, newProjectId] },
        });
    });

    it('should sign up initial user as `master-admin`', function() {
        expect(userRole).to.equal('master-admin');
    });

    it('should confirm that `master-admin` exists', function(done) {
        request.get('/user/masterAdminExists').end(function(err, res) {
            expect(res).to.have.status(200);
            expect(res.body).have.property('result');
            expect(res.body.result).to.eql(true);
            done();
        });
    });

    // 'post /user/signup'
    it('should register `user` without stripeToken, stripePlanId', function(done) {
        createEnterpriseUser(request, data.newUser, function(err, res) {
            const project = res.body.project;
            newProjectId = project._id;
            expect(res).to.have.status(200);
            expect(res.body.email).to.equal(
                data.newUser.email.toLocaleLowerCase()
            );
            expect(res.body.role).to.equal('user');
            done();
        });
    });

    it('should login with valid credentials', function(done) {
        request
            .post('/user/login')
            .send({
                email: data.newUser.email,
                password: data.newUser.password,
            })
            .end(function(err, res) {
                expect(res).to.have.status(200);
                expect(res.body.email).to.equal(
                    data.newUser.email.toLocaleLowerCase()
                );
                expect(res.body).include.keys('tokens');
                done();
            });
    });

    it('should login with valid credentials, and return sent redirect url', function(done) {
        request
            .post('/user/login')
            .send({
                email: data.newUser.email,
                password: data.newUser.password,
                redirect: 'http://oneuptime.com',
            })
            .end(function(err, res) {
                expect(res).to.have.status(200);
                expect(res.body.email).to.equal(
                    data.newUser.email.toLocaleLowerCase()
                );
                expect(res.body).have.property('redirect');
                expect(res.body.redirect).to.eql('http://oneuptime.com');
                done();
            });
    });

    it('should get list of users without their hashed passwords', function(done) {
        const authorization = `Basic ${token}`;
        request
            .get('/user/users')
            .set('Authorization', authorization)
            .end(async function(err, res) {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('data');
                expect(res.body.data).to.be.an('array');
                expect(res.body.data.length).to.eql(2);
                const { data } = res.body;
                for (const element of data) {
                    expect(element).to.be.an('object');
                    expect(element).to.not.have.property('password');
                }
                done();
            });
    });

    it('should turn off 2fa for a user', function(done) {
        request
            .post('/user/login')
            .send({
                email: data.newUser.email,
                password: data.newUser.password,
            })
            .then(function(res) {
                const jwtToken = res.body.tokens.jwtAccessToken;
                request
                    .put('/user/profile')
                    .set('Authorization', `Basic ${jwtToken}`)
                    .send({
                        twoFactorAuthEnabled: true,
                        email: data.newUser.email,
                    })
                    .then(function(res) {
                        request
                            .put(`/user/${res.body._id}/2fa`)
                            .set('Authorization', `Basic ${token}`)
                            .send({
                                email: data.newUser.email.toLocaleLowerCase(),
                                twoFactorAuthEnabled: !res.body
                                    .twoFactorAuthEnabled,
                            })
                            .end(function(err, res) {
                                expect(res.body.twoFactorAuthEnabled).to.eql(
                                    false
                                );
                                done();
                            });
                    });
            });
    });

    it('should not turn off 2fa for a user if loged in user is not admin', function(done) {
        request
            .post('/user/login')
            .send({
                email: data.newUser.email,
                password: data.newUser.password,
            })
            .then(function(res) {
                const jwtToken = res.body.tokens.jwtAccessToken;
                request
                    .put('/user/profile')
                    .set('Authorization', `Basic ${jwtToken}`)
                    .send({
                        twoFactorAuthEnabled: true,
                        email: data.newUser.email,
                    })
                    .then(function(res) {
                        request
                            .put(`/user/${res.body._id}/2fa`)
                            .set('Authorization', `Basic ${jwtToken}`)
                            .send({
                                email: data.newUser.email,
                                twoFactorAuthEnabled: !res.body
                                    .twoFactorAuthEnabled,
                            })
                            .end(function(err, result) {
                                expect(result).to.have.status(400);
                                done();
                            });
                    });
            });
    });
});
