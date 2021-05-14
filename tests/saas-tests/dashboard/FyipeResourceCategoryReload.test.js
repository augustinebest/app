const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

let browser, page;
const user = {
    email: utils.generateRandomBusinessEmail(),
    password: '1234567890',
};

const resourceCategory = utils.generateRandomString();

/** This is a test to check:
 * No errors on page reload
 * It stays on the same page on reload
 */

describe('Fyipe Page Reload', () => {
    const operationTimeOut = init.timeout;

    beforeAll(async done => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);
        await init.registerUser(user, page); // This automatically routes to dashboard page
        done();
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test(
        'Should reload the resource category page and confirm there are no errors',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageClick(page, '#more');
            await init.pageClick(page, '#resources');
            await init.pageClick(page, '#createResourceCategoryButton');
            await init.pageType(
                page,
                '#resourceCategoryName',
                resourceCategory
            );
            await init.pageClick(page, '#addResourceCategoryButton');
            await page.waitForSelector('#addResourceCategoryButton', {
                hidden: true,
            });
            await page.waitForSelector('#resource-category-name', {
                visible: true,
            });
            //To confirm no errors and stays on the same page on reload
            await page.reload({ waitUntil: 'networkidle2' });
            await page.waitForSelector('#cbResources', { visible: true });
            const spanElement = await page.waitForSelector(
                '#resource-category-name',
                { visible: true }
            );
            expect(spanElement).toBeDefined();
            done();
        },
        operationTimeOut
    );
});