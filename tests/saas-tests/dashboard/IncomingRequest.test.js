const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

require('should');
let browser, page;
// user credentials
const email = utils.generateRandomBusinessEmail();
const password = '1234567890';
const user = {
    email,
    password,
};
const incidentRequest = {
    name: 'pyInt',
    incidentTitle: 'Test Incident',
    incidentType: 'offline',
    incidentDescription:
        'This is a sample incident to test incoming http request',
};

describe('Incoming HTTP Request', () => {
    const operationTimeOut = init.timeout;

    beforeAll(async done => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);
        // user
        await init.registerUser(user, page);

        done();
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test(
        'should configure incoming http request to create incident in a project',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#projectSettings', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageWaitForSelector(page, '#integrations', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#integrations');
            await init.pageClick(page, '.http-request-tab');

            await init.pageWaitForSelector(page, '#addIncomingRequestBtn', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#addIncomingRequestBtn');
            await init.pageWaitForSelector(page, '#name', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#name');
            await init.pageType(page, '#name', incidentRequest.name);
            await init.page$Eval(page, '#createIncident', elem => elem.click());
            await init.pageWaitForSelector(page, '#selectAllMonitors', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#selectAllMonitors', elem =>
                elem.click()
            );
            await init.pageClick(page, '#advancedOptionsBtn');
            await init.pageWaitForSelector(page, '#incidentTitle', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#incidentTitle');
            await init.pageType(
                page,
                '#incidentTitle',
                incidentRequest.incidentTitle
            );
            await init.pageClick(page, '#incidentDescription');
            await init.pageType(
                page,
                '#incidentDescription',
                incidentRequest.incidentDescription
            );

            await init.pageClick(page, '#createIncomingRequest');
            await init.pageWaitForSelector(page, '#createIncomingRequest', {
                hidden: true,
            });
            await init.pageWaitForSelector(page, '#requestOkBtn', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#requestOkBtn');
            await init.pageWaitForSelector(page, '#requestOkBtn', {
                hidden: true,
            });

            const firstIncomingHttpRequest = await init.pageWaitForSelector(
                page,
                '#copyIncomingRequestBtn_0',
                { visible: true, timeout: init.timeout }
            );
            expect(firstIncomingHttpRequest).toBeDefined();

            done();
        },
        operationTimeOut
    );

    test(
        'should update an incoming http request in a project',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#projectSettings', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageWaitForSelector(page, '#integrations', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#integrations');
            await init.pageClick(page, '.http-request-tab');

            await init.pageWaitForSelector(page, '#editIncomingRequestBtn_0', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#editIncomingRequestBtn_0');
            await init.pageWaitForSelector(page, '#name', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#name', { clickCount: 3 });
            // change the name of the incoming http request
            await init.pageType(page, '#name', 'newName');
            await init.pageClick(page, '#editIncomingRequest');
            await init.pageWaitForSelector(page, '#editIncomingRequest', {
                hidden: true,
            });

            const updatedRequest = await init.pageWaitForSelector(
                page,
                '#incomingRequest_newName',
                { visible: true, timeout: init.timeout }
            );
            expect(updatedRequest).toBeDefined();
            done();
        },
        operationTimeOut
    );

    test(
        'should delete an incoming http request in a project',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#projectSettings', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageWaitForSelector(page, '#integrations', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#integrations');
            await init.pageClick(page, '.http-request-tab');

            await init.pageWaitForSelector(
                page,
                '#deleteIncomingRequestBtn_0',
                {
                    visible: true,
                    timeout: init.timeout,
                }
            );
            await init.pageClick(page, '#deleteIncomingRequestBtn_0');
            await init.pageWaitForSelector(page, '#deleteIncomingRequestBtn', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#deleteIncomingRequestBtn');
            await init.pageWaitForSelector(page, '#deleteIncomingRequestBtn', {
                hidden: true,
            });

            const noIncomingRequest = await init.pageWaitForSelector(
                page,
                '#noIncomingRequest',
                { visible: true, timeout: init.timeout }
            );
            expect(noIncomingRequest).toBeDefined();
            done();
        },
        operationTimeOut
    );
});
