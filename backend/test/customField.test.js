process.env.PORT = 3020;
process.env.IS_SAAS_SERVICE = true;
const chai = require('chai');
const expect = require('chai').expect;
const userData = require('./data/user');
const app = require('../server');
chai.use(require('chai-http'));
const request = chai.request.agent(app);
const GlobalConfig = require('./utils/globalConfig');
const { createUser } = require('./utils/userSignUp');
const VerificationTokenModel = require('../backend/models/verificationToken');
const AirtableService = require('../backend/services/airtableService');
const UserService = require('../backend/services/userService');
const ProjectService = require('../backend/services/projectService');
const ComponentService = require('../backend/services/componentService');
const IncidentCustomFieldService = require('../backend/services/customFieldService');

describe('Incident Custom Field API', function() {
    const timeout = 30000;
    let projectId, userId, token, authorization, customFieldId;

    const incidentFieldText = {
            fieldName: 'inTextField',
            fieldType: 'text',
        },
        incidentFieldNumber = {
            fieldName: 'inNumField',
            fieldType: 'number',
        };

    this.timeout(timeout);
    before(function(done) {
        GlobalConfig.initTestConfig().then(function() {
            createUser(request, userData.user, function(err, res) {
                const project = res.body.project;
                projectId = project._id;
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
                                    email: userData.user.email,
                                    password: userData.user.password,
                                })
                                .end(function(err, res) {
                                    token = res.body.tokens.jwtAccessToken;
                                    authorization = `Basic ${token}`;
                                    done();
                                });
                        });
                });
            });
        });
    });

    after(async function() {
        await GlobalConfig.removeTestConfig();
        await ProjectService.hardDeleteBy({ _id: projectId });
        await UserService.hardDeleteBy({
            email: userData.user.email.toLowerCase(),
        });
        await ComponentService.hardDeleteBy({ projectId });
        await IncidentCustomFieldService.hardDeleteBy({ projectId });
        await AirtableService.deleteAll({ tableName: 'User' });
    });

    it('should not create an incident custom field when field name is missing or not specified', function(done) {
        request
            .post(`/customField/${projectId}`)
            .send({ fieldType: 'text' })
            .set('Authorization', authorization)
            .end(function(err, res) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal('Field name is required');
                done();
            });
    });

    it('should not create an incident custom field when field type is missing or not specified', function(done) {
        request
            .post(`/customField/${projectId}`)
            .send({ fieldName: 'missingType' })
            .set('Authorization', authorization)
            .end(function(err, res) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal('Field type is required');
                done();
            });
    });

    it('should setup custom fields for all incidents in a project (text)', function(done) {
        request
            .post(`/customField/${projectId}`)
            .send(incidentFieldText)
            .set('Authorization', authorization)
            .end(function(err, res) {
                customFieldId = res.body._id;
                expect(res).to.have.status(200);
                expect(res.body.fieldName).to.be.equal(
                    incidentFieldText.fieldName
                );
                done();
            });
    });

    it('should not create incident custom field with an existing name in a project', function(done) {
        request
            .post(`/customField/${projectId}`)
            .send(incidentFieldText)
            .set('Authorization', authorization)
            .end(function(err, res) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Custom field with this name already exist'
                );
                done();
            });
    });

    it('should update a particular incident custom field in a project', function(done) {
        incidentFieldText.fieldName = 'newName';

        request
            .put(`/customField/${projectId}/${customFieldId}`)
            .send(incidentFieldText)
            .set('Authorization', authorization)
            .end(function(err, res) {
                expect(res).to.have.status(200);
                expect(res.body.fieldName).to.be.equal(
                    incidentFieldText.fieldName
                );
                expect(String(res.body._id)).to.be.equal(String(customFieldId));
                done();
            });
    });

    it('should list all the incident custom fields in a project', function(done) {
        // add one more monitor custom field
        request
            .post(`/customField/${projectId}`)
            .send(incidentFieldNumber)
            .set('Authorization', authorization)
            .end(function() {
                request
                    .get(`/customField/${projectId}?skip=0&limit=10`)
                    .set('Authorization', authorization)
                    .end(function(err, res) {
                        expect(res).to.have.status(200);
                        expect(res.body.count).to.be.equal(2);
                        expect(res.body.data).to.be.an('array');
                        done();
                    });
            });
    });

    it('should delete a particular monitor custom field in a project', function(done) {
        request
            .delete(`/customField/${projectId}/${customFieldId}`)
            .set('Authorization', authorization)
            .end(function(err, res) {
                expect(res).to.have.status(200);
                expect(String(res.body._id)).to.be.equal(String(customFieldId));
                done();
            });
    });
});
