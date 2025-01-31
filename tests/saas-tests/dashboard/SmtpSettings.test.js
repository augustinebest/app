const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

require('should');
let browser, page;
// user credentials
const email = utils.generateRandomBusinessEmail();
const name = utils.generateRandomString();
const password = '1234567890';
const user = {
    email,
    password,
};
// smtp credential
const smtpData = { ...utils.smtpCredential };

describe('Custom SMTP Settings', () => {
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
        'should create a custom smtp settings',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#projectSettings', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageWaitForSelector(page, '#more', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#more');
            await init.pageWaitForSelector(page, '#email', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#email');
            await init.pageWaitForSelector(page, '#showsmtpForm', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#showsmtpForm');
            await init.pageWaitForSelector(page, '#user', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#user');
            await init.pageType(page, '#user', smtpData.user);
            await init.pageClick(page, '#pass');
            await init.pageType(page, '#pass', smtpData.pass);
            await init.pageClick(page, '#host');
            await init.pageType(page, '#host', smtpData.host);
            await init.pageClick(page, '#port');
            await init.pageType(page, '#port', smtpData.port);
            await init.pageClick(page, '#from');
            await init.pageType(page, '#from', smtpData.from);
            await init.pageClick(page, '#name');
            await init.pageType(page, '#name', name);
            await init.page$Eval(
                page,
                '#secure',
                elem => (elem.checked = true)
            );
            await init.pageClick(page, '#saveSmtp');

            await init.pageWaitForSelector(page, '.ball-beat', {
                hidden: true,
            });
            await init.navigateToSmtp(page);
            await init.pageWaitForSelector(page, '#host', {
                visible: true,
                timeout: init.timeout,
            });
            const host = await init.page$Eval(
                page,
                '#host',
                elem => elem.value
            );
            expect(host).toEqual(smtpData.host);

            done();
        },
        operationTimeOut
    );

    test(
        'should update a custom smtp settings',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#projectSettings', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageWaitForSelector(page, '#more', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#more');
            await init.pageWaitForSelector(page, '#email', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#email');
            const from = 'test@oneuptime.com';
            await init.pageWaitForSelector(page, '#from', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#from', { clickCount: 3 });
            await init.pageType(page, '#from', from);
            await init.pageClick(page, '#saveSmtp');
            await init.pageWaitForSelector(page, '#saveSmtpLoading');
            await init.pageWaitForSelector(page, '#saveSmtpLoading', {
                hidden: true, // This confirms that the request has been fulfilled
            });

            await init.navigateToSmtp(page);
            await init.pageWaitForSelector(page, '#from', {
                visible: true,
                timeout: init.timeout,
            });
            const fromVal = await init.page$Eval(
                page,
                '#from',
                elem => elem.value
            );
            expect(fromVal).toEqual(from);

            done();
        },
        operationTimeOut
    );

    test(
        'should not save a custom smtp settings if one of the input fields is missing',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#projectSettings', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageWaitForSelector(page, '#more', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#more');
            await init.pageWaitForSelector(page, '#email', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#email');
            await init.pageWaitForSelector(page, '#port', {
                visible: true,
                timeout: init.timeout,
            });
            const port = await init.page$(page, '#port');
            await port.click({ clickCount: 3 });
            await port.press('Backspace'); // clear out the input field
            await init.pageClick(page, '#saveSmtp');
            await init.pageWaitForSelector(page, '#port');
            const emptyMessage = await init.page$Eval(
                page,
                '#port',
                element => element.textContent
            );
            // This confirms that the port is empty, hence could not be saved
            expect(emptyMessage).toEqual('');

            done();
        },
        operationTimeOut
    );

    test(
        'should delete custom smtp settings',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#projectSettings', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageWaitForSelector(page, '#more', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#more');
            await init.pageWaitForSelector(page, '#email', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#email');
            await init.pageWaitForSelector(page, 'label[id=showsmtpForm]', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(
                page,
                'label[id=enableSecureTransport]',
                {
                    visible: true,
                    timeout: init.timeout,
                }
            );
            await init.pageWaitForSelector(page, '#saveSmtp', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, 'label[id=enableSecureTransport]');
            await init.pageClick(page, 'label[id=showsmtpForm]');
            await init.pageClick(page, '#saveSmtp');
            await init.navigateToSmtp(page);
            const username = await init.page$(page, '#user', { hidden: true });
            expect(username).toBe(null);

            done();
        },
        operationTimeOut
    );

    test(
        'should not display any error message if custom smtp settings is already deleted and user clicks on save',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });
            await init.pageWaitForSelector(page, '#projectSettings', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#projectSettings');
            await init.pageWaitForSelector(page, '#more', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#more');
            await init.pageWaitForSelector(page, '#email', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#email');
            await init.pageWaitForSelector(page, '#saveSmtp', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageClick(page, '#saveSmtp');
            const error = await init.pageWaitForSelector(page, '#errorInfo', {
                hidden: true,
            });
            expect(error).toBeDefined();

            done();
        },
        operationTimeOut
    );
});
