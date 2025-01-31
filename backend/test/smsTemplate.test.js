process.env.PORT = 3020;
const expect = require('chai').expect;
const userData = require('./data/user');
const chai = require('chai');
chai.use(require('chai-http'));
const app = require('../server');
const GlobalConfig = require('./utils/globalConfig');
const request = chai.request.agent(app);
const { createUser } = require('./utils/userSignUp');
const UserService = require('../backend/services/userService');
const ProjectService = require('../backend/services/projectService');
const SmsTemplateService = require('../backend/services/smsTemplateService');
const NotificationService = require('../backend/services/notificationService');
const AirtableService = require('../backend/services/airtableService');

const VerificationTokenModel = require('../backend/models/verificationToken');

let token, projectId, userId, smsTemplateId;

describe('SMS Template API', function() {
    this.timeout(20000);

    before(async function() {
        this.timeout(40000);
        await GlobalConfig.initTestConfig();
        const res = await createUser(request, userData.user);
        const project = res.body.project;
        projectId = project._id;
        userId = res.body.id;
        const verificationToken = await VerificationTokenModel.findOne({
            userId,
        });
        await request
            .get(`/user/confirmation/${verificationToken.token}`)
            .redirects(0);
        const res1 = await request.post('/user/login').send({
            email: userData.user.email,
            password: userData.user.password,
        });
        token = res1.body.tokens.jwtAccessToken;
    });

    after(async function() {
        await GlobalConfig.removeTestConfig();
        await UserService.hardDeleteBy({
            email: {
                $in: [
                    userData.user.email.toLowerCase(),
                    userData.newUser.email.toLowerCase(),
                    userData.anotherUser.email.toLowerCase(),
                ],
            },
        });
        await ProjectService.hardDeleteBy({ _id: projectId });
        await NotificationService.hardDeleteBy({ projectId: projectId });
        await SmsTemplateService.hardDeleteBy({ projectId: projectId });
        await AirtableService.deleteAll({ tableName: 'User' });
    });

    // 'post /:projectId'
    it('should create an sms template with valid data', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/smsTemplate/${projectId}`)
            .set('Authorization', authorization)
            .send({
                body: 'SMS Body',
                smsType: 'Subscriber Incident Created',
            });
        smsTemplateId = res.body._id;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.body).to.be.equal('SMS Body');
    });

    it('should sanitize dirty template data sent to endpoint', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/smsTemplate/${projectId}`)
            .set('Authorization', authorization)
            .send({
                body: '<img src=x onerror=alert(1)//>',
                smsType: 'Subscriber Incident Created',
            });
        expect(res).to.have.status(200);
        expect(res.body.body).to.be.equal('<img src="x">');
    });

    it('should get an array of sms templates by valid projectId', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .get(`/smsTemplate/${projectId}`)
            .set('Authorization', authorization);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
    });

    it('should get an sms template by valid smsTemplateId', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .get(`/smsTemplate/${projectId}/smsTemplate/${smsTemplateId}`)
            .set('Authorization', authorization);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
    });

    it('should update an sms template by valid smsTemplateId', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .put(`/smsTemplate/${projectId}/smsTemplate/${smsTemplateId}`)
            .send({
                body: 'New SMS Body',
            })
            .set('Authorization', authorization);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.body).to.be.equal('New SMS Body');
    });

    it('should update default sms template', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .put(`/smsTemplate/${projectId}`)
            .send([
                {
                    body: 'Updated SMS Body',
                    smsType: 'Subscriber Incident Acknowledged',
                },
            ])
            .set('Authorization', authorization);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body[1].body).to.be.equal('Updated SMS Body');
    });

    it('should deleted an sms template', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .delete(`/smsTemplate/${projectId}/smsTemplate/${smsTemplateId}`)
            .set('Authorization', authorization);
        expect(res).to.have.status(200);
    });
});
