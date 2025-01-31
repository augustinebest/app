const puppeteer = require('puppeteer');

const utils = require('../../test-utils');
const init = require('../../test-init');
let browser, page;
require('should');

const email = utils.generateRandomBusinessEmail();
const password = '1234567890';

describe('About Modal (IS_SAAS_SERVICE=false)', () => {
    const operationTimeOut = init.timeout;

    beforeAll(async done => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);

        const user = {
            email: email,
            password: password,
        };
        await init.registerEnterpriseUser(user, page, false);

        done();
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test(
        'should show about option in admin dashboard profile menu',
        async () => {
            await page.goto(utils.ADMIN_DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });

            // if element does not exist it will timeout and throw
            await init.pageWaitForSelector(page, '#profile-menu', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#profile-menu', elem => elem.click());
            const about = await init.pageWaitForSelector(
                page,
                '#about-button',
                {
                    visible: true,
                    timeout: init.timeout,
                }
            );
            expect(about).toBeDefined();
        },
        operationTimeOut
    );

    test(
        'should show about modal with app versions',
        async () => {
            await page.goto(utils.ADMIN_DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });
            await init.pageWaitForSelector(page, '#profile-menu', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#profile-menu', elem => elem.click());
            await init.pageWaitForSelector(page, '#about-button', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#about-button', elem => elem.click());
            await init.pageWaitForSelector(page, '.bs-Modal', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, '#server-version', {
                visible: true,
                timeout: init.timeout,
            });
            const serverVersion = await init.page$Eval(
                page,
                '#server-version',
                elem => elem.textContent
            );
            const docsVersion = await init.page$Eval(
                page,
                '#docs-version',
                elem => elem.textContent
            );
            const helmVersion = await init.page$Eval(
                page,
                '#helm-version',
                elem => elem.textContent
            );
            const dashboardVersion = await init.page$Eval(
                page,
                '#dashboard-version',
                elem => elem.textContent
            );
            const adminDashboardVersion = await init.page$Eval(
                page,
                '#admin-dashboard-version',
                elem => elem.textContent
            );

            const probeVersion = await init.page$Eval(
                page,
                '#probe-version',
                elem => elem.textContent
            );

            expect(serverVersion).toBeDefined();
            expect(docsVersion).toBeDefined();
            expect(helmVersion).toBeDefined();
            expect(dashboardVersion).toBeDefined();
            expect(adminDashboardVersion).toBeDefined();
            expect(probeVersion).toBeDefined();
        },
        operationTimeOut
    );

    test(
        'should close about modal',
        async () => {
            await page.goto(utils.ADMIN_DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });
            await init.pageWaitForSelector(page, '#profile-menu', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#profile-menu', elem => elem.click());
            await init.pageWaitForSelector(page, '#about-button', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#about-button', elem => elem.click());
            await init.pageWaitForSelector(page, '.bs-Button', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '.bs-Button');
        },
        operationTimeOut
    );
});
