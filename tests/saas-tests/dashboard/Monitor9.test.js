const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

let browser, page;
require('should');

// user credentials
const password = '1234567890';

describe('API Monitor API', () => {
    const operationTimeOut = init.timeout;

    const componentName = utils.generateRandomString();
    const testMonitorName = utils.generateRandomString();

    beforeAll(async () => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);

        await page.goto(utils.HTTP_TEST_SERVER_URL + '/settings');
        await page.evaluate(
            () => (document.getElementById('responseTime').value = '')
        );
        await page.evaluate(
            () => (document.getElementById('statusCode').value = '')
        );
        await page.evaluate(
            () => (document.getElementById('header').value = '')
        );
        await page.evaluate(() => (document.getElementById('body').value = ''));
        await init.pageWaitForSelector(page, '#responseTime');
        await init.pageClick(page, 'input[name=responseTime]');
        await init.pageType(page, 'input[name=responseTime]', '0');
        await init.pageWaitForSelector(page, '#statusCode');
        await init.pageClick(page, 'input[name=statusCode]');
        await init.pageType(page, 'input[name=statusCode]', '200');
        await page.select('#responseType', 'json');
        await init.pageWaitForSelector(page, '#header');
        await init.pageClick(page, 'textarea[name=header]');
        await init.pageType(
            page,
            'textarea[name=header]',
            '{"Content-Type":"application/json"}'
        );
        await init.pageWaitForSelector(page, '#body');
        await init.pageClick(page, 'textarea[name=body]');
        await init.pageType(page, 'textarea[name=body]', '{"status":"ok"}');
        await init.pageClick(page, 'button[type=submit]');
        await init.pageWaitForSelector(page, '#save-btn');
        await init.pageWaitForSelector(page, '#save-btn', {
            visible: true,
            timeout: init.timeout,
        });

        const user = {
            email: utils.generateRandomBusinessEmail(),
            password,
        };
        await init.registerUser(user, page);

        await init.addComponent(componentName, page);
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test(
        'should add API monitor with valid url and evaluate response (online criteria) in advance options',
        async done => {
            // Navigate to Component details
            await init.navigateToComponentDetails(componentName, page);

            //const newMonitorName = utils.generateRandomString();
            await init.addAPIMonitorWithJSExpression(page, testMonitorName);

            let spanElement = await init.pageWaitForSelector(
                page,
                `#monitor-title-${testMonitorName}`
            );
            spanElement = await spanElement.getProperty('innerText');
            spanElement = await spanElement.jsonValue();
            spanElement.should.be.exactly(testMonitorName);

            const probeTabs = await init.page$$(page, 'button[id^=probes-btn]');
            for (const probeTab of probeTabs) {
                await probeTab.click();

                let monitorStatusElement = await init.page$(
                    page,
                    `#monitor-status-${testMonitorName}`
                );
                if (monitorStatusElement) {
                    monitorStatusElement = await monitorStatusElement.getProperty(
                        'innerText'
                    );
                    monitorStatusElement = await monitorStatusElement.jsonValue();
                    monitorStatusElement.should.be.exactly('Online');
                }
            }
            done();
        },
        operationTimeOut
    );
    // Second Monitor has been created an will be used in most of the remaining tests.
    test(
        'should strip trailing semicolons from evaluate response js expressions',
        async done => {
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                testMonitorName,
                page
            );

            const editButtonSelector = `#edit_${testMonitorName}`;
            await init.pageWaitForSelector(page, editButtonSelector, {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, editButtonSelector, e => e.click());

            await init.pageWaitForSelector(page, '#form-new-monitor');
            await init.pageWaitForSelector(page, '#advanceOptions');
            await init.pageClick(page, '#advanceOptions');

            // for online criteria
            const upFields = await init.page$$(
                page,
                `input[name*="up_"][name*=".field1"]`
            );
            const lastUpField = upFields[upFields.length - 1];
            const upExpression = await (
                await lastUpField.getProperty('value')
            ).jsonValue();

            expect(upExpression).toEqual("response.body.status === 'ok'");

            // for degraded criteria
            const degradedFields = await init.page$$(
                page,
                `input[name*="degraded_"][name*=".field1"]`
            );
            const lastDegradedField = degradedFields[degradedFields.length - 1];
            const degradedExpression = await (
                await lastDegradedField.getProperty('value')
            ).jsonValue();
            expect(degradedExpression).toEqual(
                "response.body.message === 'draining'"
            );
            done();
        },
        operationTimeOut
    );

    test(
        'should evaluate response (degraded criteria) in advance options',
        async done => {
            await page.goto(utils.HTTP_TEST_SERVER_URL + '/settings');
            await page.evaluate(
                () => (document.getElementById('responseTime').value = '')
            );
            await page.evaluate(
                () => (document.getElementById('body').value = '')
            );
            await init.pageWaitForSelector(page, '#responseTime');
            await init.pageClick(page, 'input[name=responseTime]');
            await init.pageType(page, 'input[name=responseTime]', '5000');
            await init.pageWaitForSelector(page, '#body');
            await init.pageClick(page, 'textarea[name=body]');
            await init.pageType(
                page,
                'textarea[name=body]',
                '{"message":"draining"}'
            );
            await init.pageClick(page, 'button[type=submit]');
            await init.pageWaitForSelector(page, '#save-btn');
            await init.pageWaitForSelector(page, '#save-btn', {
                visible: true,
                timeout: init.timeout,
            });

            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#notificationscroll');
            await init.pageClick(page, '#closeIncident_0');

            await init.pageClick(page, '#components');
            await init.pageWaitForSelector(page, '.Text-color--yellow');
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                testMonitorName,
                page
            );

            const probeTabs = await init.page$$(page, 'button[id^=probes-btn]');
            for (const probeTab of probeTabs) {
                await probeTab.click();

                await init.pageWaitForSelector(page, '#monitor-color-yellow');
                let monitorStatusElement = await init.page$(
                    page,
                    `#monitor-status-${testMonitorName}`
                );
                if (monitorStatusElement) {
                    monitorStatusElement = await monitorStatusElement.getProperty(
                        'innerText'
                    );
                    monitorStatusElement = await monitorStatusElement.jsonValue();
                    monitorStatusElement.should.be.exactly('Degraded');
                }
            }
            done();
        },
        operationTimeOut
    );

    test(
        'should evaluate response (offline criteria) in advance options',
        async done => {
            // This navigates to http-server and creates the appropriate settings before dashboard page.
            await page.goto(utils.HTTP_TEST_SERVER_URL + '/settings');
            await page.evaluate(
                () => (document.getElementById('statusCode').value = '')
            );
            await page.evaluate(
                () => (document.getElementById('body').value = '')
            );
            await init.pageWaitForSelector(page, '#statusCode');
            await init.pageClick(page, 'input[name=statusCode]');
            await init.pageType(page, 'input[name=statusCode]', '400');
            await init.pageWaitForSelector(page, '#body');
            await init.pageClick(page, 'textarea[name=body]');
            await init.pageType(
                page,
                'textarea[name=body]',
                '{"message":"offline"}'
            );
            await init.pageClick(page, 'button[type=submit]');
            await init.pageWaitForSelector(page, '#save-btn');
            await init.pageWaitForSelector(page, '#save-btn', {
                visible: true,
                timeout: init.timeout,
            });

            // Dashboard Page
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#notificationscroll');
            await init.pageClick(page, '#closeIncident_0');

            await init.pageClick(page, '#components');
            await init.pageWaitForSelector(page, '.Text-color--red');
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                testMonitorName,
                page
            );

            const probeTabs = await init.page$$(page, 'button[id^=probes-btn]');
            for (const probeTab of probeTabs) {
                await probeTab.click();

                await init.pageWaitForSelector(page, '#monitor-color-red');
                let monitorStatusElement = await init.page$(
                    page,
                    `#monitor-status-${testMonitorName}`
                );
                if (monitorStatusElement) {
                    monitorStatusElement = await monitorStatusElement.getProperty(
                        'innerText'
                    );
                    monitorStatusElement = await monitorStatusElement.jsonValue();
                    monitorStatusElement.should.be.exactly('Offline');
                }
            }
            done();
        },
        operationTimeOut
    );

    test('should display offline status if evaluate response does not match in criteria', async done => {
        // This navigates to http-server and creates the appropriate settings before dashboard page.
        await page.goto(utils.HTTP_TEST_SERVER_URL + '/settings');
        await page.evaluate(
            () => (document.getElementById('responseTime').value = '')
        );
        await page.evaluate(
            () => (document.getElementById('statusCode').value = '')
        );
        await page.evaluate(() => (document.getElementById('body').value = ''));
        await init.pageWaitForSelector(page, '#responseTime');
        await init.pageClick(page, 'input[name=responseTime]');
        await init.pageType(page, 'input[name=responseTime]', '0');
        await init.pageWaitForSelector(page, '#statusCode');
        await init.pageClick(page, 'input[name=statusCode]');
        await init.pageType(page, 'input[name=statusCode]', '200');
        await init.pageWaitForSelector(page, '#body');
        await init.pageClick(page, 'textarea[name=body]');
        await init.pageType(page, 'textarea[name=body]', '{"status":"not ok"}');
        await init.pageClick(page, 'button[type=submit]');
        await init.pageWaitForSelector(page, '#save-btn');
        await init.pageWaitForSelector(page, '#save-btn', {
            visible: true,
            timeout: init.timeout,
        });

        await page.goto(utils.DASHBOARD_URL, {
            waitUntil: ['networkidle2'],
        });

        // Navigate to Monitor details
        await init.navigateToMonitorDetails(
            componentName,
            testMonitorName,
            page
        );

        const probeTabs = await init.page$$(page, 'button[id^=probes-btn]');
        for (const probeTab of probeTabs) {
            await probeTab.click();
            await init.pageWaitForSelector(page, '#monitor-color-red');
            let monitorStatusElement = await init.page$(
                page,
                `#monitor-status-${testMonitorName}`
            );
            if (monitorStatusElement) {
                monitorStatusElement = await monitorStatusElement.getProperty(
                    'innerText'
                );
                monitorStatusElement = await monitorStatusElement.jsonValue();
                monitorStatusElement.should.be.exactly('Offline');
            }
        }
        done();

        operationTimeOut;
    });

    test(
        'should show specific property, button and modal for evaluate response',
        async done => {
            // Navigate to Component details
            await init.navigateToComponentDetails(componentName, page);

            const newMonitorName = utils.generateRandomString();
            await init.pageWaitForSelector(page, '#cbMonitors');
            await init.pageClick(page, '#newFormId');
            await init.addAPIMonitorWithJSExpression(page, newMonitorName, {
                createAlertForOnline: true,
            });

            // wait for a new incident is created
            await init.pageWaitForSelector(page, '#notificationscroll');
            await init.pageClick(page, '#viewIncident-0');

            let monitorIncidentReportElement = await init.pageWaitForSelector(
                page,
                `#${newMonitorName}_IncidentReport_0`
            );
            monitorIncidentReportElement = await monitorIncidentReportElement.getProperty(
                'innerText'
            );
            monitorIncidentReportElement = await monitorIncidentReportElement.jsonValue();
            expect(monitorIncidentReportElement).toContain(
                'Response {"status":"not ok"} Did evaluate response.body.status === \'ok\'.'
            );

            await init.pageWaitForSelector(
                page,
                `#${newMonitorName}_ShowResponse_0`
            );
            await init.pageClick(page, `#${newMonitorName}_ShowResponse_0`);

            let monitorIncidentModalElement = await init.pageWaitForSelector(
                page,
                '#API_Response'
            );
            monitorIncidentModalElement = await monitorIncidentModalElement.getProperty(
                'innerText'
            );
            monitorIncidentModalElement = await monitorIncidentModalElement.jsonValue();
            monitorIncidentModalElement.should.be.exactly('API Response');
            done();
        },
        operationTimeOut
    );

    test(
        'should delete API monitors',
        async done => {
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                testMonitorName,
                page
            );
            const deleteButtonSelector = `#delete_${testMonitorName}`;
            await init.pageWaitForSelector(page, deleteButtonSelector);
            await init.page$Eval(page, deleteButtonSelector, e => e.click());

            const confirmDeleteButtonSelector = '#deleteMonitor';
            await init.pageWaitForSelector(page, confirmDeleteButtonSelector);
            await init.pageClick(page, confirmDeleteButtonSelector);
            await init.pageWaitForSelector(page, confirmDeleteButtonSelector, {
                hidden: true,
            });

            const selector = `span#monitor-title-${testMonitorName}`;
            const spanElement = await init.page$(page, selector, {
                hidden: true,
            });
            expect(spanElement).toBeNull();
            done();
        },
        operationTimeOut
    );
});
