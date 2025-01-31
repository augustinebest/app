const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

require('should');
let browser, browser2, page, browserPage;
const admin = {
    email: 'masteradmin@hackerbay.io',
    password: '1234567890',
};
// user credentials
const user = {
    email: `test${utils.generateRandomBusinessEmail()}`,
    password: '1234567890',
};

describe('Users', () => {
    const operationTimeOut = init.timeout;
    beforeAll(async () => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig); // User-Dashboard
        browser2 = await puppeteer.launch(utils.puppeteerLaunchConfig); // Admin-Dashboard
        page = await browser.newPage();
        browserPage = await browser2.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
        );

        // Register users
        await init.registerEnterpriseUser(user, browserPage);
    });

    afterAll(async done => {
        await browser.close();
        await browser2.close();
        done();
    });
    /**  This test works by running user dashboard and admin dashboard in two seperate browsers.
     as two dashboards cannot be run in the same browser */
    it(
        'should logout the user if the admin deletes the account from the dashboard.',
        async done => {
            await page.bringToFront();
            await init.loginUser(user, page);
            await browserPage.bringToFront();
            await browserPage.waitForSelector(`#${user.email.split('@')[0]}`, {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(browserPage, `#${user.email.split('@')[0]}`);
            await browserPage.waitForSelector('#delete', {
                visible: true,
                timeout: init.timeout,
            });

            await init.pageClick(browserPage, '#delete');
            await browserPage.waitForSelector('#confirmDelete', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(browserPage, '#confirmDelete');
            await browserPage.waitForSelector('#confirmDelete', {
                hidden: true,
            });

            await page.bringToFront();
            await init.pageWaitForSelector(page, '#statusPages');
            await init.pageClick(page, '#statusPages');
            await init.pageWaitForSelector(page, '#login-button', {
                visible: true,
                timeout: init.timeout,
            });
            done();
        },
        operationTimeOut
    );

    it(
        'should be able to restore deleted users (using admin account)',
        async done => {
            await init.loginAdminUser(admin, page);
            await init.pageWaitForSelector(
                page,
                `#deleted__${user.email.split('@')[0]}`
            );
            await init.pageClick(page, `#deleted__${user.email.split('@')[0]}`);

            await init.pageWaitForSelector(page, '#restore', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#restore');
            const delBtn = await init.pageWaitForSelector(page, '#delete', {
                visible: true,
                timeout: init.timeout,
            });
            expect(delBtn).toBeDefined();
            done();
        },
        operationTimeOut
    );
});
