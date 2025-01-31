const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

let browser, page;
const user = {
    email: utils.generateRandomBusinessEmail(),
    password: '1234567890',
};
const componentName = utils.generateRandomString();
const logName = utils.generateRandomString();

/** This is a test to check:
 * No errors on page reload
 * It stays on the same page on reload
 */

describe('OneUptime Page Reload', () => {
    const operationTimeOut = init.timeout;

    beforeAll(async done => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);

        await init.registerUser(user, page); // This automatically routes to dashboard page
        await init.addComponent(componentName, page);
        done();
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test(
        'Should reload the component logs page and confirm there are no errors',
        async done => {
            await init.navigateToComponentDetails(componentName, page);
            await init.pageWaitForSelector(page, '#logs', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#logs');
            await init.pageWaitForSelector(page, '#form-new-application-log', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, 'input[name=name]', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageType(page, 'input[name=name]', logName);
            await init.pageWaitForSelector(page, '#addApplicationLogButton', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#addApplicationLogButton');
            let spanElement;
            spanElement = await init.pageWaitForSelector(
                page,
                '#application-content-header',
                { visible: true, timeout: init.timeout }
            );
            expect(spanElement).toBeDefined();

            // To confirm no errors and stays on the same page on reload
            await page.reload({ waitUntil: 'networkidle2' });
            await init.pageWaitForSelector(page, `#cb${componentName}`, {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, '#cbLogs', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, `#cb${logName}`, {
                visible: true,
                timeout: init.timeout,
            });

            spanElement = await init.pageWaitForSelector(
                page,
                '#application-content-header',
                { visible: true, timeout: init.timeout }
            );
            expect(spanElement).toBeDefined();
            done();
        },
        operationTimeOut
    );
});
