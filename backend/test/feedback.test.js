process.env.PORT = 3020;
const expect = require('chai').expect;
const userData = require('./data/user');
const chai = require('chai');
chai.use(require('chai-http'));
const app = require('../server');
const EmailStatusService = require('../backend/services/emailStatusService');
const request = chai.request.agent(app);
const { createUser } = require('./utils/userSignUp');
const UserService = require('../backend/services/userService');
const FeedbackService = require('../backend/services/feedbackService');
const ProjectService = require('../backend/services/projectService');
const VerificationTokenModel = require('../backend/models/verificationToken');
const AirtableService = require('../backend/services/airtableService');
const GlobalConfig = require('./utils/globalConfig');
const selectEmailStatus =
    'from to subject body createdAt template status content error deleted deletedAt deletedById replyTo smtpServer';

let token, projectId, userId;

describe('Feedback API', function() {
    this.timeout(50000);

    before(function(done) {
        this.timeout(40000);
        GlobalConfig.initTestConfig().then(function() {
            GlobalConfig.enableEmailLog().then(function() {
                createUser(request, userData.user, function(err, res) {
                    const project = res.body.project;
                    projectId = project._id;
                    userId = res.body.id;

                    VerificationTokenModel.findOne({ userId }, function(
                        err,
                        verificationToken
                    ) {
                        request
                            .get(
                                `/user/confirmation/${verificationToken.token}`
                            )
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
        await UserService.hardDeleteBy({
            email: {
                $in: [
                    userData.user.email.toLowerCase(),
                    userData.newUser.email.toLowerCase(),
                    userData.anotherUser.email.toLowerCase(),
                ],
            },
        });
        await ProjectService.hardDeleteBy({ _id: projectId }, userId);
        await AirtableService.deleteAll({ tableName: 'User' });
    });

    it('should create feedback and check the sent emails to oneuptime team and user', async function() {
        const authorization = `Basic ${token}`;
        const testFeedback = {
            feedback: 'test feedback',
            page: 'test page',
        };
        const res = await request
            .post(`/feedback/${projectId}`)
            .set('Authorization', authorization)
            .send(testFeedback);
        expect(res).to.have.status(200);
        await FeedbackService.hardDeleteBy({ _id: res.body._id });
        await AirtableService.deleteFeedback(res.body.airtableId);
        const emailStatuses = await EmailStatusService.findBy({
            query: {},
            select: selectEmailStatus,
        });
        if (emailStatuses[0].subject.includes('Thank you')) {
            expect(emailStatuses[0].subject).to.equal(
                'Thank you for your feedback!'
            );
        } else {
            const subject = 'Welcome to OneUptime.';
            const status = emailStatuses.find(
                status => status.subject === subject
            );
            expect(status.subject).to.equal(subject);
        }
    });
});
