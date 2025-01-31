const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

let browser, page;
// parent user credentials
const email = utils.generateRandomBusinessEmail();
const password = '1234567890';
const user = {
    email,
    password,
};

describe('Stripe cards API', () => {
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
        'should add a valid card',
        async done => {
            await page.goto(utils.DASHBOARD_URL, { timeout: init.timeout });
            await init.pageClick(page, '#profile-menu');
            await init.pageClick(page, '#profileBilling');
            await init.pageWaitForSelector(page, '#cardNo_0');
            await init.pageWaitForSelector(page, '#addCardButton');
            await init.pageClick(page, '#addCardButton');
            await init.pageWaitForSelector(
                page,
                '.__PrivateStripeElement > iframe[title="Secure card payment input frame"]',
                {
                    visible: true,
                    timeout: operationTimeOut,
                }
            );
            const stripeIframe = await init.page$(
                page,
                '.__PrivateStripeElement > iframe[title="Secure card payment input frame"]'
            );
            const frame = await stripeIframe.contentFrame();
            frame.waitForSelector('input[name=cardnumber]');
            await frame.type('input[name=cardnumber]', '5555555555554444', {
                // 4242... has been used during account reg. Similar cards number are rejected. The new number is from stripe documentations.
                delay: 200,
            });
            frame.waitForSelector('input[name=exp-date]');
            await frame.type('input[name=exp-date]', '11/23');
            frame.waitForSelector('input[name=cvc]');
            await frame.type('input[name=cvc]', '100');
            frame.waitForSelector('input[name=postal]');
            await frame.type('input[name=postal]', '11234');
            await init.pageClick(page, '#addCardButtonSubmit');
            await init.pageWaitForSelector(page, '#addCardButtonSubmit', {
                hidden: true,
                timeout: operationTimeOut,
            });

            const cardsCount = await init.page$Eval(
                page,
                '#cardsCount',
                el => el.textContent
            );

            expect(cardsCount).toEqual('2 Cards');

            done();
        },
        operationTimeOut
    );

    test(
        'should delete card',
        async done => {
            await page.goto(`${utils.DASHBOARD_URL}/dashboard/profile/billing`);
            await init.pageWaitForSelector(page, '#deleteCard1');
            await init.pageClick(page, '#deleteCard1');
            await init.pageWaitForSelector(page, '#deleteCardButton');
            await init.pageClick(page, '#deleteCardButton');
            await init.pageWaitForSelector(page, '#deleteCardButton', {
                hidden: true,
            });

            const cardsCount = await init.page$Eval(
                page,
                '#cardsCount',
                el => el.textContent
            );

            expect(cardsCount).toEqual('1 Card');

            done();
        },
        operationTimeOut
    );

    test(
        'should not delete card when there is only one card left',
        async done => {
            await page.goto(`${utils.DASHBOARD_URL}/dashboard/profile/billing`);
            await init.pageWaitForSelector(page, '#deleteCard0');
            await init.pageClick(page, '#deleteCard0');
            await init.pageWaitForSelector(page, '#deleteCardButton');
            await init.pageClick(page, '#deleteCardButton');
            const deleteError = await init.pageWaitForSelector(
                page,
                '#deleteCardError',
                {
                    visible: true,
                    timeout: operationTimeOut,
                }
            );
            expect(deleteError).toBeDefined();
            await init.pageClick(page, '#deleteCardCancel');

            const cardsCount = await init.page$Eval(
                page,
                '#cardsCount',
                el => el.textContent
            );

            expect(cardsCount).toEqual('1 Card');
            done();
        },
        operationTimeOut
    );

    test(
        'should not add an invalid card',
        async done => {
            await page.goto(`${utils.DASHBOARD_URL}/dashboard/profile/billing`);
            await init.pageWaitForSelector(page, '#addCardButton');
            await init.pageClick(page, '#addCardButton');
            await init.pageWaitForSelector(
                page,
                '.__PrivateStripeElement > iframe[title="Secure card payment input frame"]',
                {
                    visible: true,
                    timeout: operationTimeOut,
                }
            );
            const stripeIframe = await init.page$(
                page,
                '.__PrivateStripeElement > iframe[title="Secure card payment input frame"]'
            );

            const frame = await stripeIframe.contentFrame();
            frame.waitForSelector('input[name=cardnumber]');
            await frame.type('input[name=cardnumber]', '42444242424242424242', {
                // This is a proper invalid card
                delay: 200,
            });
            frame.waitForSelector('input[name=exp-date]');
            await frame.type('input[name=exp-date]', '11/23');
            frame.waitForSelector('input[name=cvc]');
            await frame.type('input[name=cvc]', '100');
            frame.waitForSelector('input[name=postal]');
            await frame.type('input[name=postal]', '11234');
            await init.pageClick(page, '#addCardButtonSubmit');
            const error = await init.pageWaitForSelector(page, '#cardError', {
                visible: true,
                timeout: init.timeout,
            });
            expect(error).toBeDefined();
            done();
        },
        operationTimeOut
    );
});
