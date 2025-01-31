const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');
const speakeasy = require('speakeasy');
const { expect } = require('chai');

require('should');
const projectName = 'project';

let browser, page;
// user credentials
const email = utils.generateRandomBusinessEmail();
const password = '1234567890';
let token;

const generateOtp = () => {
    const otp = speakeasy.totp({
        secret: token.trim(),
        encoding: 'base32',
    });
    return otp;
};

describe('TwoFactor Authentication API', () => {
    const operationTimeOut = init.timeout;
    beforeAll(async done => {
        jest.setTimeout(360000);
        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);

        const user = {
            email: email,
            password: password,
        };
        //user login
        await init.registerUser(user, page);
        await init.addProject(page, projectName);

        done();
    });

    afterAll(async done => {
        browser.close();
        done();
    });

    test(
        'Should throw an error when invalid otp token is passed',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });

            await init.pageWaitForSelector(page, '#profile-menu');
            await init.pageClick(page, '#profile-menu');
            await init.pageWaitForSelector(page, '#userProfile');
            await init.pageClick(page, '#userProfile');
            await init.pageWaitForSelector(page, '#profileSettings', {
                visible: true,
                timeout: init.timeout,
            });

            await init.pageWaitForSelector(page, '#twoFactorLabel');
            await init.pageClick(page, '#twoFactorLabel');

            await init.pageWaitForSelector(page, '#nextFormButton');
            await init.pageClick(page, '#nextFormButton');
            await init.pageWaitForSelector(page, '#token');
            await init.pageType(page, '#token', '432424');
            await init.pageWaitForSelector(page, '#enableTwoFactorAuthButton');
            await init.pageClick(page, '#enableTwoFactorAuthButton');

            const message = await init.page$Eval(
                page,
                '#modal-message',
                element => element.innerHTML
            );
            expect(message).equal('Invalid token.');
            done();
        },
        operationTimeOut
    );

    test(
        'Should enable twoFactor authentication',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: ['networkidle2'],
            });

            await init.pageWaitForSelector(page, '#profile-menu');
            await init.pageClick(page, '#profile-menu');
            await init.pageWaitForSelector(page, '#userProfile');
            await init.pageClick(page, '#userProfile');
            await init.pageWaitForSelector(page, '#profileSettings', {
                visible: true,
                timeout: init.timeout,
            });

            await init.pageWaitForSelector(page, '#twoFactorLabel');
            await init.pageClick(page, '#twoFactorLabel');

            await init.pageWaitForSelector(page, '#otpath-url');
            token = await init.page$Eval(
                page,
                '#otpath-url',
                element => element.innerHTML
            );
            const otp = await generateOtp(token);
            await init.pageWaitForSelector(page, '#nextFormButton');
            await init.pageClick(page, '#nextFormButton');
            await init.pageWaitForSelector(page, '#token');
            await init.pageType(page, '#token', otp.toString());
            await init.pageWaitForSelector(page, '#enableTwoFactorAuthButton');
            await init.pageClick(page, '#enableTwoFactorAuthButton');
            const isVisible = await init.isElementOnPage(
                page,
                '#modal-message'
            );
            expect(isVisible).equal(false);
            await init.saasLogout(page);
            done();
        },
        operationTimeOut
    );
    test(
        'Should ask a user with two factor enabled when they are about to login again',
        async done => {
            await page.goto(utils.ACCOUNTS_URL + '/login', {
                waitUntil: 'networkidle2',
            });
            await init.pageWaitForSelector(page, '#login-button');
            await init.pageClick(page, 'input[name=email]');
            await init.pageType(page, 'input[name=email]', email);
            await init.pageClick(page, 'input[name=password]');
            await init.pageType(page, 'input[name=password]', password);
            await init.pageClick(page, 'button[type=submit]');
            await init.pageWaitForSelector(page, '.message', {
                visible: true,
                timeout: init.timeout,
            });

            const message = await init.page$Eval(
                page,
                '.message',
                element => element.innerHTML
            );
            expect(message).equal('Enter your auth token below to login.');
            done();
        },
        operationTimeOut
    );

    test(
        'Should throw an error when invalid otp token is passed during login',
        async done => {
            await page.goto(utils.ACCOUNTS_URL + '/login', {
                waitUntil: 'networkidle2',
            });
            await init.pageWaitForSelector(page, '#login-button');
            await init.pageClick(page, 'input[name=email]');
            await init.pageType(page, 'input[name=email]', email);
            await init.pageClick(page, 'input[name=password]');
            await init.pageType(page, 'input[name=password]', password);
            await init.pageClick(page, 'button[type=submit]');

            await init.pageWaitForSelector(page, '#token');
            await init.pageType(page, '#token', '432224');
            await init.pageWaitForSelector(page, 'button[type=submit]');
            await init.pageClick(page, 'button[type=submit]');

            const message = await init.page$Eval(
                page,
                '.title span',
                element => element.innerHTML
            );
            expect(message).equal('Invalid token.');
            done();
        },
        operationTimeOut
    );
    test(
        'Should successfully login when valid otp token is passed during login',
        async done => {
            await page.goto(utils.ACCOUNTS_URL + '/login', {
                waitUntil: 'networkidle2',
            });
            await init.pageWaitForSelector(page, '#login-button');
            await init.pageClick(page, 'input[name=email]');
            await init.pageType(page, 'input[name=email]', email);
            await init.pageClick(page, 'input[name=password]');
            await init.pageType(page, 'input[name=password]', password);
            await init.pageClick(page, 'button[type=submit]');

            const otp = generateOtp();
            await init.pageWaitForSelector(page, '#token');
            await init.pageType(page, '#token', otp.toString());
            await init.pageWaitForSelector(page, 'button[type=submit]');
            await init.pageClick(page, 'button[type=submit]');
            await init.pageWaitForSelector(page, '#home', {
                visible: true,
                timeout: init.timeout,
            });
            done();
        },
        operationTimeOut
    );
});
