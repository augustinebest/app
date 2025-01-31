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
const ScheduledEventService = require('../backend/services/scheduledEventService');
const MonitorService = require('../backend/services/monitorService');
const AirtableService = require('../backend/services/airtableService');

const VerificationTokenModel = require('../backend/models/verificationToken');
const ComponentModel = require('../backend/models/component');
const scheduledEventNoteService = require('../backend/services/scheduledEventNoteService');

let token,
    userId,
    projectId,
    scheduledEventId,
    componentId,
    monitorId,
    internalNoteId,
    investigationNoteId;

const scheduledEvent = {
    name: 'New scheduled Event',
    startDate: '2019-06-11 11:01:52.178',
    endDate: '2019-06-26 11:31:53.302',
    description: 'New scheduled Event description ',
    showEventOnStatusPage: true,
    alertSubscriber: true,
    callScheduleOnEvent: true,
    monitorDuringEvent: false,
};

const internalNote = {
    type: 'internal',
    event_state: 'update',
    content: 'This is an update for internal',
};

const updatedInternalNote = {
    type: 'internal',
    event_state: 'something new',
    content: 'Something new for new',
};

const investigationNote = {
    type: 'investigation',
    event_state: 'investigating',
    content: 'This is an investigation note',
};

const updatedInvestigationNote = {
    type: 'investigation',
    event_state: 'test',
    content: 'Just updated this note',
};

describe('Scheduled Event Note', function() {
    this.timeout(20000);

    before(function(done) {
        this.timeout(40000);
        GlobalConfig.initTestConfig().then(function() {
            createUser(request, userData.user, function(err, res) {
                const project = res.body.project;
                userId = res.body.id;
                projectId = project._id;

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
                                    const authorization = `Basic ${token}`;
                                    ComponentModel.create({
                                        name: 'Test Component',
                                    }).then(component => {
                                        componentId = component._id;
                                        request
                                            .post(`/monitor/${projectId}`)
                                            .set('Authorization', authorization)
                                            .send({
                                                name: 'New Monitor 1',
                                                type: 'url',
                                                data: {
                                                    url: 'http://www.tests.org',
                                                },
                                                componentId,
                                            })
                                            .end(async function(err, res) {
                                                monitorId = res.body._id;

                                                request
                                                    .post(
                                                        `/scheduledEvent/${projectId}`
                                                    )
                                                    .set(
                                                        'Authorization',
                                                        authorization
                                                    )
                                                    .send({
                                                        ...scheduledEvent,
                                                        monitors: [monitorId],
                                                    })
                                                    .end(async function(
                                                        err,
                                                        res
                                                    ) {
                                                        scheduledEventId =
                                                            res.body._id;

                                                        const scheduledEventNotes = [];

                                                        for (
                                                            let i = 0;
                                                            i < 12;
                                                            i++
                                                        ) {
                                                            scheduledEventNotes.push(
                                                                {
                                                                    type:
                                                                        'internal',
                                                                    event_state:
                                                                        'update',
                                                                    content:
                                                                        'This is an update for internal',
                                                                }
                                                            );
                                                        }

                                                        const createdScheduledEventNotes = scheduledEventNotes.map(
                                                            async scheduledEventNote => {
                                                                const sentRequests = await request
                                                                    .post(
                                                                        `/scheduledEvent/${projectId}/${scheduledEventId}/notes`
                                                                    )
                                                                    .set(
                                                                        'Authorization',
                                                                        authorization
                                                                    )
                                                                    .send(
                                                                        scheduledEventNote
                                                                    );
                                                                return sentRequests;
                                                            }
                                                        );

                                                        await Promise.all(
                                                            createdScheduledEventNotes
                                                        );

                                                        done();
                                                    });
                                            });
                                    });
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
            email: {
                $in: [
                    userData.user.email.toLowerCase(),
                    userData.newUser.email.toLowerCase(),
                    userData.anotherUser.email.toLowerCase(),
                ],
            },
        });
        await ScheduledEventService.hardDeleteBy({
            _id: scheduledEventId,
            projectId,
        });
        await scheduledEventNoteService.hardDelete({ scheduledEventId });
        await MonitorService.hardDeleteBy({ _id: monitorId });
        await AirtableService.deleteAll({ tableName: 'User' });
    });

    it('should get all scheduled event notes => internal notes', function(done) {
        const authorization = `Basic ${token}`;

        request
            .get(
                `/scheduledEvent/${projectId}/${scheduledEventId}/notes?type=internal`
            )
            .set('Authorization', authorization)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('count');
                expect(res.body.count).to.be.a('number');
                expect(res.body.count).to.equal(12);
                done();
            });
    });

    it('should get first 10 scheduled event notes for data length 10, skip 0, limit 10 and count 12 => internal notes', function(done) {
        const authorization = `Basic ${token}`;

        request
            .get(
                `/scheduledEvent/${projectId}/${scheduledEventId}/notes?type=internal&skip=0&limit=10`
            )
            .set('Authorization', authorization)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('data');
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.length(10);
                expect(res.body).to.have.property('count');
                expect(parseInt(res.body.count))
                    .to.be.a('number')
                    .to.equal(12);
                expect(res.body).to.have.property('skip');
                expect(parseInt(res.body.skip))
                    .to.be.a('number')
                    .to.equal(0);
                expect(res.body).to.have.property('limit');
                expect(parseInt(res.body.limit))
                    .to.be.a('number')
                    .to.equal(10);
                done();
            });
    });

    it('should get 2 last scheduled events notes with data length 2, skip 10, limit 10 and count 12 => internal notes', function(done) {
        const authorization = `Basic ${token}`;

        request
            .get(
                `/scheduledEvent/${projectId}/${scheduledEventId}/notes?type=internal&skip=10&limit=10`
            )
            .set('Authorization', authorization)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('data');
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.length(2);
                expect(res.body).to.have.property('count');
                expect(parseInt(res.body.count))
                    .to.be.a('number')
                    .to.equal(12);
                expect(res.body).to.have.property('skip');
                expect(parseInt(res.body.skip))
                    .to.be.a('number')
                    .to.equal(10);
                expect(res.body).to.have.property('limit');
                expect(parseInt(res.body.limit))
                    .to.be.a('number')
                    .to.equal(10);
                done();
            });
    });

    it('should create a scheduled event note => internal note', function(done) {
        const authorization = `Basic ${token}`;

        request
            .post(`/scheduledEvent/${projectId}/${scheduledEventId}/notes`)
            .set('Authorization', authorization)
            .send(internalNote)
            .end((err, res) => {
                internalNoteId = res.body._id;
                expect(res).to.have.status(200);
                expect(res.body.event_state).to.equal(internalNote.event_state);
                done();
            });
    });

    it('should create a scheduled event note => investigation note', function(done) {
        const authorization = `Basic ${token}`;

        request
            .post(`/scheduledEvent/${projectId}/${scheduledEventId}/notes`)
            .set('Authorization', authorization)
            .send(investigationNote)
            .end((err, res) => {
                investigationNoteId = res.body._id;
                expect(res).to.have.status(200);
                expect(res.body.content).to.equal(investigationNote.content);
                done();
            });
    });

    it('should not create a scheduled event note if any of the field is missing', function(done) {
        const authorization = `Basic ${token}`;

        request
            .post(`/scheduledEvent/${projectId}/${scheduledEventId}/notes`)
            .set('Authorization', authorization)
            .send({ ...internalNote, event_state: '' })
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
    });

    it('should not creat a scheduled event note if type field is not investigation or internal', function(done) {
        const authorization = `Basic ${token}`;

        request
            .post(`/scheduledEvent/${projectId}/${scheduledEventId}/notes`)
            .set('Authorization', authorization)
            .send({ ...internalNote, type: 'randomType' })
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
    });

    it('should update a note => internal note', function(done) {
        const authorization = `Basic ${token}`;

        request
            .put(
                `/scheduledEvent/${projectId}/${scheduledEventId}/notes/${internalNoteId}`
            )
            .set('Authorization', authorization)
            .send(updatedInternalNote)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.event_state).to.equal(
                    updatedInternalNote.event_state
                );
                done();
            });
    });

    it('should update a note => investigation note', function(done) {
        const authorization = `Basic ${token}`;

        request
            .put(
                `/scheduledEvent/${projectId}/${scheduledEventId}/notes/${investigationNoteId}`
            )
            .set('Authorization', authorization)
            .send(updatedInvestigationNote)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.event_state).to.equal(
                    updatedInvestigationNote.event_state
                );
                done();
            });
    });

    it('should not update a note if the scheduled event note does not exist', function(done) {
        const authorization = `Basic ${token}`;
        const noteId = projectId;

        request
            .put(
                `/scheduledEvent/${projectId}/${scheduledEventId}/notes/${noteId}`
            )
            .set('Authorization', authorization)
            .send(updatedInternalNote)
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
    });

    it('should delete a scheduled event note => internal note', function(done) {
        const authorization = `Basic ${token}`;

        request
            .delete(
                `/scheduledEvent/${projectId}/${scheduledEventId}/notes/${internalNoteId}`
            )
            .set('Authorization', authorization)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body._id).to.equal(internalNoteId);
                done();
            });
    });

    it('should delete a scheduled event note => investigation note', function(done) {
        const authorization = `Basic ${token}`;

        request
            .delete(
                `/scheduledEvent/${projectId}/${scheduledEventId}/notes/${investigationNoteId}`
            )
            .set('Authorization', authorization)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body._id).to.equal(investigationNoteId);
                done();
            });
    });

    it('should note delete a scheduled event note if it does not exist', function(done) {
        const authorization = `Basic ${token}`;
        const noteId = projectId;

        request
            .delete(
                `/scheduledEvent/${projectId}/${scheduledEventId}/notes/${noteId}`
            )
            .set('Authorization', authorization)
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
    });
});
