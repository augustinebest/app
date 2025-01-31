const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

let browser, page;
require('should');

// user credentials
const email = utils.generateRandomBusinessEmail();
const password = '1234567890';
const componentName = utils.generateRandomString();
const testServerMonitorName = utils.generateRandomString();

describe('Monitor API', () => {
    const operationTimeOut = init.timeout;

    beforeAll(async () => {
        jest.setTimeout(600000);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);

        const user = {
            email,
            password,
        };
        await init.registerUser(user, page);
        await init.addHttpTestServerMonitorToComponent(
            componentName,
            testServerMonitorName,
            page
        );
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test('should degrade (not timeout and return status code 408) monitor with response time longer than init.timeoutms and status code 200', async done => {
        const bodyText = utils.generateRandomString();
        // This navigates to hhtp-test server and create the settings for the test suite
        await page.goto(utils.HTTP_TEST_SERVER_URL + '/settings');
        await page.evaluate(
            () => (document.getElementById('responseTime').value = '')
        );
        await page.evaluate(
            () => (document.getElementById('statusCode').value = '')
        );
        await page.evaluate(
            () => (document.getElementById('header').value = '{}')
        );
        await page.evaluate(() => (document.getElementById('body').value = ''));
        await init.pageWaitForSelector(page, '#responseTime');
        await init.pageClick(page, 'input[name=responseTime]');
        await init.pageType(page, 'input[name=responseTime]', '6000'); //Any response time greater than 5000ms and status code 200 will return degraded.
        await init.pageWaitForSelector(page, '#statusCode');
        await init.pageClick(page, 'input[name=statusCode]');
        await init.pageType(page, 'input[name=statusCode]', '200');
        await page.select('#responseType', 'html');
        await init.pageWaitForSelector(page, '#body');
        await init.pageClick(page, 'textarea[name=body]');
        await init.pageType(
            page,
            'textarea[name=body]',
            `<h1 id="html"><span>${bodyText}</span></h1>`
        );
        await init.pageClick(page, 'button[type=submit]');
        await init.pageWaitForSelector(page, '#save-btn', {
            visible: true,
            timeout: init.timeout,
        });

        // Component and Monitor are already created. This is code refactoring
        await init.navigateToMonitorDetails(
            componentName,
            testServerMonitorName,
            page
        );

        await init.pageWaitForSelector(page, '#notificationscroll', {
            visbile: true,
            timeout: 600000,
        });
        await init.pageWaitForSelector(
            page,
            `#${testServerMonitorName}-degraded`
        );
        let monitorStatusElement = await init.pageWaitForSelector(
            page,
            `#monitor-status-${testServerMonitorName}`,
            { visible: true, timeout: operationTimeOut }
        );
        monitorStatusElement = await monitorStatusElement.getProperty(
            'innerText'
        );
        monitorStatusElement = await monitorStatusElement.jsonValue();
        monitorStatusElement.should.be.exactly('Degraded');

        done();
    }, 600000);
});
