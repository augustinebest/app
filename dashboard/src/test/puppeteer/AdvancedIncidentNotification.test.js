const puppeteer = require('puppeteer');
const utils = require('./test-utils');
const init = require('./test-init');
const { Cluster } = require('puppeteer-cluster');

require('should');

// user credentials
const email = utils.generateRandomBusinessEmail();
const password = '1234567890';

describe('Project Settings Page - (Email and SMS & Calls)', () => {
    const operationTimeOut = 500000;
    let cluster;
    beforeAll(async done => {
        jest.setTimeout(operationTimeOut);

        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: operationTimeOut,
        });

        cluster.on('error', err => {
            throw err;
        });

        await cluster.execute({ email, password }, async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password,
            };
            // user
            await init.registerUser(user, page);
            await init.loginUser(user, page);
            done();
        });
    });

    afterAll(async done => {
        await cluster.idle();
        await cluster.close();
        done();
    });

    test(
        'should enable sending email notification when incident is created, acknowledged or resolved',
        async done => {
            await cluster.execute(null, async ({ page }) => {
                await page.goto(utils.DASHBOARD_URL);

                await page.waitForSelector('#projectSettings', {
                    visible: true,
                });
                await page.click('#projectSettings');
                await page.waitForSelector('#email', { visible: true });
                await page.click('#email');

                await page.waitForSelector('#createdIncidentNotification', {
                    visible: true,
                });
                let sendCreatedIncidentNotification = await page.$eval(
                    '#createdIncidentNotification',
                    elem => elem.value
                );
                let sendAcknowledgedIncidentNotification = await page.$eval(
                    '#acknowledgedIncidentNotification',
                    elem => elem.value
                );
                let sendResolvedIncidentNotification = await page.$eval(
                    '#resolvedIncidentNotification',
                    elem => elem.value
                );
                sendCreatedIncidentNotification = utils.parseBoolean(
                    sendCreatedIncidentNotification
                );
                sendAcknowledgedIncidentNotification = utils.parseBoolean(
                    sendAcknowledgedIncidentNotification
                );
                sendResolvedIncidentNotification = utils.parseBoolean(
                    sendResolvedIncidentNotification
                );
                expect(sendCreatedIncidentNotification).toBeTruthy();
                expect(sendAcknowledgedIncidentNotification).toBeTruthy();
                expect(sendResolvedIncidentNotification).toBeTruthy();
            });
            done();
        },
        operationTimeOut
    );

    test(
        'should disable sending email notification when incident is created',
        async done => {
            await cluster.execute(null, async ({ page }) => {
                await page.goto(utils.DASHBOARD_URL);

                await page.waitForSelector('#projectSettings', {
                    visible: true,
                });
                await page.click('#projectSettings');
                await page.waitForSelector('#email', { visible: true });
                await page.click('#email');

                await page.waitForSelector('#createdIncidentNotification', {
                    visible: true,
                });
                await page.$eval('#createdIncidentNotification', elem =>
                    elem.click()
                );
                await page.click('#saveIncidentNotification');
                await page.waitForSelector('.ball-beat', { visible: true });
                await page.waitForSelector('.ball-beat', { hidden: true });

                await page.reload({ waitUntil: 'networkidle0' });
                await page.waitForSelector('#createdIncidentNotification', {
                    visible: true,
                });
                let checkedState = await page.$eval(
                    '#createdIncidentNotification',
                    elem => elem.value
                );
                checkedState = utils.parseBoolean(checkedState);
                expect(checkedState).toBeFalsy();
            });
            done();
        },
        operationTimeOut
    );

    test(
        'should disable sending email notification when incident is acknowledged',
        async done => {
            await cluster.execute(null, async ({ page }) => {
                await page.goto(utils.DASHBOARD_URL);

                await page.waitForSelector('#projectSettings', {
                    visible: true,
                });
                await page.click('#projectSettings');
                await page.waitForSelector('#email', { visible: true });
                await page.click('#email');

                await page.waitForSelector(
                    '#acknowledgedIncidentNotification',
                    {
                        visible: true,
                    }
                );
                await page.$eval('#acknowledgedIncidentNotification', elem =>
                    elem.click()
                );
                await page.click('#saveIncidentNotification');
                await page.waitForSelector('.ball-beat', { visible: true });
                await page.waitForSelector('.ball-beat', { hidden: true });

                await page.reload({ waitUntil: 'networkidle0' });
                await page.waitForSelector(
                    '#acknowledgedIncidentNotification',
                    {
                        visible: true,
                    }
                );
                let checkedState = await page.$eval(
                    '#acknowledgedIncidentNotification',
                    elem => elem.value
                );
                checkedState = utils.parseBoolean(checkedState);
                expect(checkedState).toBeFalsy();
            });
            done();
        },
        operationTimeOut
    );

    test(
        'should disable sending email notification when incident is resolved',
        async done => {
            await cluster.execute(null, async ({ page }) => {
                await page.goto(utils.DASHBOARD_URL);

                await page.waitForSelector('#projectSettings', {
                    visible: true,
                });
                await page.click('#projectSettings');
                await page.waitForSelector('#email', { visible: true });
                await page.click('#email');

                await page.waitForSelector('#resolvedIncidentNotification', {
                    visible: true,
                });
                await page.$eval('#resolvedIncidentNotification', elem =>
                    elem.click()
                );
                await page.click('#saveIncidentNotification');
                await page.waitForSelector('.ball-beat', { visible: true });
                await page.waitForSelector('.ball-beat', { hidden: true });

                await page.reload({ waitUntil: 'networkidle0' });
                await page.waitForSelector('#resolvedIncidentNotification', {
                    visible: true,
                });
                let checkedState = await page.$eval(
                    '#resolvedIncidentNotification',
                    elem => elem.value
                );
                checkedState = utils.parseBoolean(checkedState);
                expect(checkedState).toBeFalsy();
            });
            done();
        },
        operationTimeOut
    );

    test(
        'should enable sending sms notification when incident is created, acknowledged or resolved',
        async done => {
            await cluster.execute(null, async ({ page }) => {
                await page.goto(utils.DASHBOARD_URL);

                await page.waitForSelector('#projectSettings', {
                    visible: true,
                });
                await page.click('#projectSettings');
                await page.waitForSelector('#smsCalls', { visible: true });
                await page.click('#smsCalls');

                await page.waitForSelector('#createdIncidentNotification', {
                    visible: true,
                });
                let sendCreatedIncidentNotification = await page.$eval(
                    '#createdIncidentNotification',
                    elem => elem.value
                );
                let sendAcknowledgedIncidentNotification = await page.$eval(
                    '#acknowledgedIncidentNotification',
                    elem => elem.value
                );
                let sendResolvedIncidentNotification = await page.$eval(
                    '#resolvedIncidentNotification',
                    elem => elem.value
                );
                sendCreatedIncidentNotification = utils.parseBoolean(
                    sendCreatedIncidentNotification
                );
                sendAcknowledgedIncidentNotification = utils.parseBoolean(
                    sendAcknowledgedIncidentNotification
                );
                sendResolvedIncidentNotification = utils.parseBoolean(
                    sendResolvedIncidentNotification
                );
                expect(sendCreatedIncidentNotification).toBeTruthy();
                expect(sendAcknowledgedIncidentNotification).toBeTruthy();
                expect(sendResolvedIncidentNotification).toBeTruthy();
            });
            done();
        },
        operationTimeOut
    );

    test(
        'should disable sending sms notification when incident is created',
        async done => {
            await cluster.execute(null, async ({ page }) => {
                await page.goto(utils.DASHBOARD_URL);

                await page.waitForSelector('#projectSettings', {
                    visible: true,
                });
                await page.click('#projectSettings');
                await page.waitForSelector('#smsCalls', { visible: true });
                await page.click('#smsCalls');

                await page.waitForSelector('#createdIncidentNotification', {
                    visible: true,
                });
                await page.$eval('#createdIncidentNotification', elem =>
                    elem.click()
                );
                await page.click('#saveIncidentNotification');
                await page.waitForSelector('.ball-beat', { visible: true });
                await page.waitForSelector('.ball-beat', { hidden: true });

                await page.reload({ waitUntil: 'networkidle0' });
                await page.waitForSelector('#createdIncidentNotification', {
                    visible: true,
                });
                let checkedState = await page.$eval(
                    '#createdIncidentNotification',
                    elem => elem.value
                );
                checkedState = utils.parseBoolean(checkedState);
                expect(checkedState).toBeFalsy();
            });
            done();
        },
        operationTimeOut
    );

    test(
        'should disable sending sms notification when incident is acknowledged',
        async done => {
            await cluster.execute(null, async ({ page }) => {
                await page.goto(utils.DASHBOARD_URL);

                await page.waitForSelector('#projectSettings', {
                    visible: true,
                });
                await page.click('#projectSettings');
                await page.waitForSelector('#smsCalls', { visible: true });
                await page.click('#smsCalls');

                await page.waitForSelector(
                    '#acknowledgedIncidentNotification',
                    {
                        visible: true,
                    }
                );
                await page.$eval('#acknowledgedIncidentNotification', elem =>
                    elem.click()
                );
                await page.click('#saveIncidentNotification');
                await page.waitForSelector('.ball-beat', { visible: true });
                await page.waitForSelector('.ball-beat', { hidden: true });

                await page.reload({ waitUntil: 'networkidle0' });
                await page.waitForSelector(
                    '#acknowledgedIncidentNotification',
                    {
                        visible: true,
                    }
                );
                let checkedState = await page.$eval(
                    '#acknowledgedIncidentNotification',
                    elem => elem.value
                );
                checkedState = utils.parseBoolean(checkedState);
                expect(checkedState).toBeFalsy();
            });
            done();
        },
        operationTimeOut
    );

    test(
        'should disable sending sms notification when incident is resolved',
        async done => {
            await cluster.execute(null, async ({ page }) => {
                await page.goto(utils.DASHBOARD_URL);

                await page.waitForSelector('#projectSettings', {
                    visible: true,
                });
                await page.click('#projectSettings');
                await page.waitForSelector('#smsCalls', { visible: true });
                await page.click('#smsCalls');

                await page.waitForSelector('#resolvedIncidentNotification', {
                    visible: true,
                });
                await page.$eval('#resolvedIncidentNotification', elem =>
                    elem.click()
                );
                await page.click('#saveIncidentNotification');
                await page.waitForSelector('.ball-beat', { visible: true });
                await page.waitForSelector('.ball-beat', { hidden: true });

                await page.reload({ waitUntil: 'networkidle0' });
                await page.waitForSelector('#resolvedIncidentNotification', {
                    visible: true,
                });
                let checkedState = await page.$eval(
                    '#resolvedIncidentNotification',
                    elem => elem.value
                );
                checkedState = utils.parseBoolean(checkedState);
                expect(checkedState).toBeFalsy();
            });
            done();
        },
        operationTimeOut
    );
});