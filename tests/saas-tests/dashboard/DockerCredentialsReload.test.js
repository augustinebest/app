const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

let browser, page;
const user = {
    email: utils.generateRandomBusinessEmail(),
    password: '1234567890',
};

const dockerRegistryUrl = utils.dockerCredential.dockerRegistryUrl;
const dockerUsername = utils.dockerCredential.dockerUsername;
const dockerPassword = utils.dockerCredential.dockerPassword;

/** This is a test to check:
 * No errors on page reload
 * It stays on the same page on reload
 */

describe('OneUptime Page Reload', () => {
    const operationTimeOut = 100000;

    beforeAll(async done => {
        jest.setTimeout(100000);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();

        await init.registerUser(user, page); // This automatically routes to dashboard page
        done();
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test(
        'Should reload the probe page and confirm there are no errors',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageClick(page, '#more');
            await init.pageClick(page, '#dockerCredentials');
            await init.pageClick(page, '#addCredentialBtn');
            await init.pageType(page, '#dockerRegistryUrl', dockerRegistryUrl);
            await init.pageType(page, '#dockerUsername', dockerUsername);
            await init.pageType(page, '#dockerPassword', dockerPassword);
            await init.pageClick(page, '#addCredentialModalBtn');
            const spanElement = await page.waitForSelector(
                `#dockerUsername_${dockerUsername}`
            );
            expect(spanElement).toBeDefined();
            //To confirm no errors and stays on the same page on reload
            await page.reload({ waitUntil: 'networkidle2' });
            await page.waitForSelector('#cbProjectSettings', { visible: true });
            await page.waitForSelector('#cbDockerCredentials', {
                visible: true,
            });
            const spanElement2 = await page.waitForSelector(
                `#dockerUsername_${dockerUsername}`
            );
            expect(spanElement2).toBeDefined();
            done();
        },
        operationTimeOut
    );
});
