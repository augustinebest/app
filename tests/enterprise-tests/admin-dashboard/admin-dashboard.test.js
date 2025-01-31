const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

require('should');

let browser;
let page;

const email = utils.generateRandomBusinessEmail();
const password = '1234567890';
const user = {
    email,
    password,
};

describe('Enterprise Admin Dashboard API', () => {
    beforeAll(async done => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);
        done();
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    it(
        'Should login to admin dashboard and create a new user with correct details',
        async done => {
            await init.registerEnterpriseUser(user, page);

            const localStorageData = await page.evaluate(() => {
                const json = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    json[key] = localStorage.getItem(key);
                }
                return json;
            });

            localStorageData.should.have.property('access_token');
            localStorageData.should.have.property(
                'email',
                'masteradmin@hackerbay.io'
            );
            page.url().should.containEql(utils.ADMIN_DASHBOARD_URL);
            done();
        },
        init.timeout
    );
});
