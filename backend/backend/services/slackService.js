module.exports = {
    // process messages to be sent to slack workspace channels
    sendNotification: async function(
        projectId,
        incident,
        monitor,
        incidentStatus,
        component,
        duration
    ) {
        const self = this;
        let response;
        const project = await ProjectService.findOneBy({
            query: { _id: projectId },
            select: 'parentProject _id slug name',
        });
        if (project && project.parentProjectId) {
            projectId = project.parentProjectId._id || project.parentProjectId;
        }
        let query = {
            projectId: projectId,
            integrationType: 'slack',
            monitors: { $elemMatch: { monitorId: monitor._id } },
        };
        if (incidentStatus === INCIDENT_RESOLVED) {
            query = {
                ...query,
                'notificationOptions.incidentResolved': true,
            };
        } else if (incidentStatus === INCIDENT_CREATED) {
            query = {
                ...query,
                'notificationOptions.incidentCreated': true,
            };
        } else if (incidentStatus === INCIDENT_ACKNOWLEDGED) {
            query = {
                ...query,
                'notificationOptions.incidentAcknowledged': true,
            };
        } else {
            return;
        }
        const select =
            'webHookName projectId createdById integrationType data monitors createdAt notificationOptions';
        const populate = [
            { path: 'createdById', select: 'name' },
            { path: 'projectId', select: 'name' },
            {
                path: 'monitors.monitorId',
                select: 'name',
                populate: [{ path: 'componentId', select: 'name' }],
            },
        ];
        const integrations = await IntegrationService.findBy({
            query,
            select,
            populate,
        });

        for (const integration of integrations) {
            response = await self.notify(
                project,
                monitor,
                incident,
                integration,
                component,
                duration
            );
        }
        return response;
    },

    // send notification to slack workspace channels
    async notify(project, monitor, incident, integration, component, duration) {
        const uri = `${global.dashboardHost}/project/${project.slug}/incidents/${incident._id}`;
        const yellow = '#fedc56';
        const green = '#028A0F';
        let payload;
        if (incident.resolved) {
            payload = {
                attachments: [
                    {
                        color: green,
                        title: `Incident Resolved`,
                        title_link: uri,
                        text: `Incident on *${component.name} / ${
                            monitor.name
                        }* is resolved by ${
                            incident.resolvedBy
                                ? incident.resolvedBy.name
                                : 'OneUptime'
                        } after being ${incident.incidentType} for ${duration}`,
                    },
                ],
            };
        } else if (incident.acknowledged) {
            payload = {
                attachments: [
                    {
                        color: yellow,
                        title: `Incident Acknowledged`,
                        title_link: uri,
                        text: `Incident on *${component.name} / ${
                            monitor.name
                        }* is acknowledged by ${
                            incident.acknowledgedBy
                                ? incident.acknowledgedBy.name
                                : 'OneUptime'
                        } after being ${incident.incidentType} for ${duration}`,
                    },
                ],
            };
        } else {
            payload = {
                attachments: [
                    {
                        color:
                            incident.incidentType === 'online'
                                ? green
                                : incident.incidentType === 'degraded'
                                ? yellow
                                : '#f00',
                        title: `New ${incident.incidentType} incident for ${monitor.name}`,
                        title_link: uri,
                        fields: [
                            {
                                title: 'Project Name:',
                                value: project.name,
                                short: true,
                            },
                            {
                                title: 'Monitor Name:',
                                value: `${component.name} / ${monitor.name}`,
                                short: true,
                            },
                            ...(incident.title
                                ? [
                                      {
                                          title: 'Incident Title:',
                                          value: incident.title,
                                          short: true,
                                      },
                                  ]
                                : []),
                            ...(incident.description
                                ? [
                                      {
                                          title: 'Incident Description:',
                                          value: incident.description,
                                          short: true,
                                      },
                                  ]
                                : []),
                            ...(incident.incidentPriority
                                ? [
                                      {
                                          title: 'Incident Priority:',
                                          value: incident.incidentPriority.name,
                                          short: true,
                                      },
                                  ]
                                : []),
                            {
                                title: 'Created By:',
                                value: incident.createdById
                                    ? incident.createdById.name
                                    : 'OneUptime',
                                short: true,
                            },
                            {
                                title: 'Incident Status:',
                                value:
                                    incident.incidentType === 'online'
                                        ? 'Online'
                                        : incident.incidentType === 'degraded'
                                        ? 'Degraded'
                                        : 'Offline',
                                short: true,
                            },
                        ],
                    },
                ],
            };
        }
        await axios.post(
            integration.data.endpoint,
            {
                ...payload,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return 'Webhook successfully pinged';
    },

    sendIncidentNoteNotification: async function(
        projectId,
        incident,
        data,
        monitor
    ) {
        const self = this;
        let response;
        const project = await ProjectService.findOneBy({
            query: { _id: projectId },
            select: 'parentProject _id slug',
        });
        if (project && project.parentProjectId) {
            projectId = project.parentProjectId._id || project.parentProjectId;
        }

        const query = {
            projectId: projectId,
            integrationType: 'slack',
            monitorId: monitor._id,
            'notificationOptions.incidentNoteAdded': true,
        };

        const select =
            'webHookName projectId createdById integrationType data monitors createdAt notificationOptions';
        const populate = [
            { path: 'createdById', select: 'name' },
            { path: 'projectId', select: 'name' },
            {
                path: 'monitors.monitorId',
                select: 'name',
                populate: [{ path: 'componentId', select: 'name' }],
            },
        ];

        const integrations = await IntegrationService.findBy({
            query,
            select,
            populate,
        });

        for (const integration of integrations) {
            response = await self.noteNotify(
                project,
                incident,
                integration,
                data,
                monitor
            );
        }
        return response;
    },

    // send notification to slack workspace channels when note is created
    async noteNotify(project, incident, integration, data, monitor) {
        const uri = `${global.dashboardHost}/project/${project.slug}/incidents/${incident._id}`;

        const payload = {
            attachments: [
                {
                    color: '#fedc56',
                    title: `Incident Note Created`,
                    title_link: uri,
                    text: `State:             ${data.incident_state}\nCreated By:   ${data.created_by}\nMonitor:        *${monitor.componentId.name} / ${monitor.name}*\nText:               ${data.content}`,
                },
            ],
        };

        await axios.post(
            integration.data.endpoint,
            {
                ...payload,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return 'Webhook successfully pinged';
    },
};

const IntegrationService = require('./integrationService');
const axios = require('axios');
const ProjectService = require('./projectService');
const {
    INCIDENT_RESOLVED,
    INCIDENT_CREATED,
    INCIDENT_ACKNOWLEDGED,
} = require('../constants/incidentEvents');
