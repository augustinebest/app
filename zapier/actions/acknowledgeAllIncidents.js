const acknowledgeAllIncidents = (z, bundle) => {
    if (bundle.cleanedRequest) return bundle.cleanedRequest;
    const data = {
        monitors: bundle.inputData.monitors,
    };
    const responsePromise = z.request({
        method: 'POST',
        url: `${bundle.authData.serverUrl}/zapier/incident/acknowledgeAllIncidents`,
        body: data,
    });
    return responsePromise.then(response => JSON.parse(response.content));
};

module.exports = {
    key: 'acknowledge_all_incidents',
    noun: 'Acknowledge',

    display: {
        label: 'Acknowledge All Incidents',
        description: 'Acknowledges all incidents.',
        important: false,
    },

    operation: {
        inputFields: [
            {
                key: 'monitors',
                type: 'string',
                placeholder: 'list of monitors',
                dynamic: 'monitors.id.name',
                altersDynamicFields: true,
                list: true,
                required: true,
            },
        ],
        perform: acknowledgeAllIncidents,
        sample: {
            projectName: 'New Project',
            projectId: '1',
            incidentId: '1',
            idNumber: '1',
            acknowledged: true,
            resolved: false,
            internalNote: 'New Note',
            investigationNote: 'New Investigation',
            createdAt: new Date().toISOString(),
            createdBy: 'oneuptime',
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: 'oneuptime',
            monitorName: 'New Sample',
            monitorType: 'url',
            monitorData: 'https://oneuptime.com',
        },
    },
};
