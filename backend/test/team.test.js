process.env.PORT = 3020;
process.env.IS_SAAS_SERVICE = true;
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
const NotificationService = require('../backend/services/notificationService');
const AirtableService = require('../backend/services/airtableService');

const payment = require('../backend/config/payment');
const stripe = require('stripe')(payment.paymentPrivateKey);

const VerificationTokenModel = require('../backend/models/verificationToken');
// eslint-disable-next-line
let token, userId, projectId, anotherUser;

describe('Team API', function() {
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
        await request.post('/user/login').send({
            email: userData.user.email,
            password: userData.user.password,
        });
        token = res.body.tokens.jwtAccessToken;
    });

    after(async function() {
        await GlobalConfig.removeTestConfig();
        await NotificationService.hardDeleteBy({ projectId: projectId });
        await AirtableService.deleteAll({ tableName: 'User' });
    });

    // 'post /monitor/:projectId/monitor'
    it('should reject the request of an unauthenticated user', async function() {
        const res = await request.get(`/team/${projectId}`).send({
            name: 'New Schedule',
        });
        expect(res).to.have.status(401);
    });

    it('should get an array of users', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .get(`/team/${projectId}`)
            .set('Authorization', authorization);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
    });

    it('should not add new users when the `emails` field is invalid', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: null,
                role: 'Member',
            });
        expect(res).to.have.status(400);
    });

    it('should not add new users when the `role` field is invalid', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: 'noreply@oneuptime.com',
                role: null,
            });
        expect(res).to.have.status(400);
    });

    it('should add new users when the `role` and `emails` field are valid', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: 'noreply1@oneuptime.com',
                role: 'Member',
            });
        anotherUser = res.body[0].team[0].userId;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
    });

    it('should not change user roles when the `role` field is invalid', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .put(`/team/${projectId}/${anotherUser}/changerole`)
            .set('Authorization', authorization)
            .send({
                role: null,
            });
        expect(res).to.have.status(400);
    });

    it('should not change user roles when the `teamMemberId` field is invalid', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .put(`/team/${projectId}/team/changerole`)
            .set('Authorization', authorization)
            .send({
                role: 'Administrator',
            });
        expect(res).to.have.status(400);
    });

    it('should change user roles', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .put(`/team/${projectId}/${anotherUser}/changerole`)
            .set('Authorization', authorization)
            .send({
                role: 'Administrator',
            });
        expect(res.body[0].team[0].userId).to.be.equal(anotherUser);
        expect(res.body[0].team[0].role).to.be.equal('Administrator');
        expect(res).to.have.status(200);
    });

    it('should not delete users when the `teamId` is not valid', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .delete(`/team/${projectId}/xxx`)
            .set('Authorization', authorization);
        expect(res).to.have.status(400);
    });

    it('should delete users', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .delete(`/team/${projectId}/${anotherUser}`)
            .set('Authorization', authorization);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
    });

    it('should get unregistered user email from the token', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: 'noreply4@oneuptime.com',
                role: 'Member',
            });
        const { userId } = res.body[0].team[0];
        const verificationToken = await VerificationTokenModel.findOne({
            userId,
        });
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');

        const res1 = await request.get(
            `/user/${verificationToken.token}/email`
        );
        expect(res1).to.have.status(200);
        expect(res1.body.token.userId.email).to.equal('noreply4@oneuptime.com');
    });
});

// eslint-disable-next-line no-unused-vars
let subProjectId,
    newUserToken,
    subProjectTeamMemberId,
    projectTeamMemberId,
    subProjectUserId;
userData.newUser.email = 'newUser@company.com'; // overide test emails to test project seats.
userData.anotherUser.email = 'anotherUser@company.com'; // overide test emails to test project seats.

describe('Team API with Sub-Projects', async function() {
    this.timeout(60000);
    before(async function() {
        this.timeout(30000);
        await GlobalConfig.initTestConfig();
        const authorization = `Basic ${token}`;
        // create a subproject for parent project
        const res1 = await request
            .post(`/project/${projectId}/subProject`)
            .set('Authorization', authorization)
            .send({ subProjectName: 'New SubProject' });
        subProjectId = res1.body[0]._id;
        // sign up second user (subproject user)
        const checkCardData = await request.post('/stripe/checkCard').send({
            tokenId: 'tok_visa',
            email: userData.email,
            companyName: userData.companyName,
        });
        const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
            checkCardData.body.id
        );

        const res2 = await request.post('/user/signup').send({
            paymentIntent: {
                id: confirmedPaymentIntent.id,
            },
            ...userData.newUser,
        });

        subProjectUserId = res2.body.id;
        const verificationToken = await VerificationTokenModel.findOne({
            userId: subProjectUserId,
        });
        await request
            .get(`/user/confirmation/${verificationToken.token}`)
            .redirects(0);
        const res3 = await request.post('/user/login').send({
            email: userData.newUser.email,
            password: userData.newUser.password,
        });
        newUserToken = res3.body.tokens.jwtAccessToken;
    });

    after(async function() {
        await GlobalConfig.removeTestConfig();
        await ProjectService.hardDeleteBy({
            _id: { $in: [projectId, subProjectId] },
        });
        await UserService.hardDeleteBy({
            email: {
                $in: [
                    userData.user.email,
                    userData.newUser.email,
                    userData.anotherUser.email,
                    'noreply1@oneuptime.com',
                    'testmail@oneuptime.com',
                ],
            },
        });
    });

    it('should add a new user to sub-project (role -> `Member`, project seat -> 4)', async () => {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${subProjectId}`)
            .set('Authorization', authorization)
            .send({
                emails: userData.newUser.email,
                role: 'Member',
            });
        const subProjectTeamMembers = res.body.find(
            teamMembers => teamMembers.projectId === subProjectId
        ).team;
        subProjectTeamMemberId = subProjectTeamMembers[0].userId;
        const project = await ProjectService.findOneBy({
            query: { _id: projectId },
            select: 'seats',
        });
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(subProjectTeamMembers[0].email).to.equal(userData.newUser.email);
        expect(parseInt(project.seats)).to.be.equal(4);
    });

    it('should add a new user to parent project and all sub-projects (role -> `Administrator`, project seat -> 4)', async () => {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: userData.anotherUser.email,
                role: 'Administrator',
            });
        const subProjectTeamMembers = res.body.find(
            teamMembers => teamMembers.projectId === subProjectId
        ).team;
        const projectTeamMembers = res.body.find(
            teamMembers => teamMembers.projectId === projectId
        ).team;
        projectTeamMemberId = projectTeamMembers[0].userId;
        const project = await ProjectService.findOneBy({
            query: { _id: projectId },
            select: 'seats',
        });
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(projectTeamMembers[0].email).to.equal(
            userData.anotherUser.email
        );
        expect(subProjectTeamMembers[0].email).to.equal(
            userData.anotherUser.email
        );
        expect(parseInt(project.seats)).to.be.equal(5);
    });

    it('should update existing user role in sub-project (old role -> member, new role -> administrator)', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .put(`/team/${subProjectId}/${subProjectTeamMemberId}/changerole`)
            .set('Authorization', authorization)
            .send({
                role: 'Administrator',
            });

        const subProjectTeamMembers = res.body.find(
            teamMembers => teamMembers.projectId === subProjectId
        ).team;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(subProjectTeamMembers[1].role).to.equal('Administrator');
    });

    it('should update existing user role in parent project and all sub-projects (old role -> administrator, new role -> member)', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .put(`/team/${projectId}/${projectTeamMemberId}/changerole`)
            .set('Authorization', authorization)
            .send({
                role: 'Member',
            });
        const projectTeamMembers = res.body.find(
            teamMembers => teamMembers.projectId === projectId
        ).team;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(projectTeamMembers[0].role).to.equal('Member');
    });

    it("should get only sub-project's team members for valid sub-project user", async function() {
        const authorization = `Basic ${newUserToken}`;
        const res = await request
            .get(`/team/${subProjectId}`)
            .set('Authorization', authorization);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.equal(4);
    });

    it('should get both project and sub-project Team Members.', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .get(`/team/${projectId}/teamMembers`)
            .set('Authorization', authorization);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body[0]).to.have.property('count');
        expect(res.body.length).to.be.equal(2);
        expect(res.body[0]._id).to.be.equal(subProjectId);
        expect(res.body[1]._id).to.be.equal(projectId);
    });

    it('should remove user from sub-project Team Members (project team members count -> 2, project seat -> 3)', async () => {
        const authorization = `Basic ${token}`;
        const res = await request
            .delete(`/team/${subProjectId}/${subProjectTeamMemberId}`)
            .set('Authorization', authorization);
        const subProjectTeamMembers = res.body.find(
            teamMembers => teamMembers.projectId === subProjectId
        ).team;
        const project = await ProjectService.findOneBy({
            query: { _id: projectId },
            select: 'seats',
        });
        expect(res).to.have.status(200);
        expect(subProjectTeamMembers.length).to.be.equal(3);
        expect(parseInt(project.seats)).to.be.equal(4);
    });

    it('should remove user from project Team Members and all sub-projects (sub-project team members count -> 1, project seat -> 2)', async () => {
        const authorization = `Basic ${token}`;
        const res = await request
            .delete(`/team/${projectId}/${projectTeamMemberId}`)
            .set('Authorization', authorization);
        const projectTeamMembers = res.body.find(
            teamMembers => teamMembers.projectId === projectId
        ).team;
        const project = await ProjectService.findOneBy({
            query: { _id: projectId },
            select: 'seats',
        });
        expect(res).to.have.status(200);
        expect(projectTeamMembers.length).to.be.equal(2);
        expect(parseInt(project.seats)).to.be.equal(3);
    });

    it('should not add members that are more than 100 on a project (role -> `Member`)', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: userData.bulkUsers.emails,
                role: 'Member',
            });
        expect(res).to.have.status(400);
    });

    it('should not add members on a project if sum of new and old members exceeds 100 (role -> `Member`)', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: userData.otherBulkUsers.emails,
                role: 'Member',
            });
        expect(res).to.have.status(400);
    });

    it('should not add members without business emails (role -> `Member`)', async function() {
        const authorization = `Basic ${token}`;
        const emails = 'sample.yahoo.com,sample@gmail.com';
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: emails,
                role: 'Member',
            });
        expect(res).to.have.status(400);
    });

    it('should add members on a project if the number does not exceeds 100 (role -> `Member`)', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: userData.moreBulkUsers.emails,
                role: 'Member',
            });
        expect(res).to.have.status(200);
        expect(res.body[0].team.length).to.be.equal(100);
    });

    it('should add unlimited members for the Viewer role (role -> `Viewer`)', async function() {
        const authorization = `Basic ${token}`;
        const res = await request
            .post(`/team/${projectId}`)
            .set('Authorization', authorization)
            .send({
                emails: userData.bulkUsers.emails,
                role: 'Viewer',
            });
        expect(res).to.have.status(200);
        expect(res.body[0].team.length).to.be.equal(220);
    });
});
