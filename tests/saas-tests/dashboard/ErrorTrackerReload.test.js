const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

let browser, page;
const user = {
    email: utils.generateRandomBusinessEmail(),
    password: '1234567890',
};
const componentName = utils.generateRandomString();
const errorTrackerName = utils.generateRandomString();

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
        'Should reload the error tracker page and confirm there are no errors',
        async done => {
            await init.navigateToComponentDetails(componentName, page);
            await init.pageWaitForSelector(page, '#errorTracking', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#errorTracking');
            await init.pageWaitForSelector(page, '#form-new-error-tracker', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, 'input[name=name]', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageType(page, 'input[name=name]', errorTrackerName);
            await init.pageWaitForSelector(page, '#addErrorTrackerButton', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#addErrorTrackerButton');
            let spanElement;
            spanElement = await init.pageWaitForSelector(
                page,
                `#error-tracker-title-${errorTrackerName}`,
                { visible: true, timeout: init.timeout }
            );
            expect(spanElement).toBeDefined();

            // To confirm no errors and stays on the same page on reload
            await page.reload({ waitUntil: 'networkidle2' });
            await init.pageWaitForSelector(page, `#cb${componentName}`, {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, '#cbErrorTracking', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, `#cb${errorTrackerName}`, {
                visible: true,
                timeout: init.timeout,
            });

            spanElement = await init.pageWaitForSelector(
                page,
                `#error-tracker-title-${errorTrackerName}`
            );
            expect(spanElement).toBeDefined();
            done();
        },
        operationTimeOut
    );
});
