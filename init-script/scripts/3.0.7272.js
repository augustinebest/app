const { find, update } = require('../util/db');

const PROJECT_COLLECTION = 'projects';
async function run() {
    // get projects without disableNotification fields for sms, email or webhook
    const projectsWithoutInvestigationNoteNotificationOptionFields = await find(
        PROJECT_COLLECTION,
        {
            $or: [
                { enableInvestigationNoteNotificationSMS: { $exists: false } },
                {
                    enableInvestigationNoteNotificationEmail: {
                        $exists: false,
                    },
                },
                {
                    enableInvestigationNoteNotificationWebhook: {
                        $exists: false,
                    },
                },
            ],
        }
    );
    // update project by setting the investigationNotification options to default value of true
    projectsWithoutInvestigationNoteNotificationOptionFields.forEach(
        project => {
            // add a default value only if the field is missing
            const updateValues = {};
            if (
                !Object.prototype.hasOwnProperty.call(
                    project,
                    'enableInvestigationNoteNotificationSMS'
                )
            ) {
                updateValues.enableInvestigationNoteNotificationSMS = true;
            }
            if (
                !Object.prototype.hasOwnProperty.call(
                    project,
                    'enableInvestigationNoteNotificationEmail'
                )
            ) {
                updateValues.enableInvestigationNoteNotificationEmail = true;
            }
            if (
                !Object.prototype.hasOwnProperty.call(
                    project,
                    'enableInvestigationNoteNotificationWebhook'
                )
            ) {
                updateValues.enableInvestigationNoteNotificationWebhook = true;
            }

            update(PROJECT_COLLECTION, { _id: project._id }, updateValues);
        }
    );
}

module.exports = run;
