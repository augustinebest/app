const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

require('should');

// user credentials
const user = {
    email: utils.generateRandomBusinessEmail(),
    password: '1234567890',
};
const componentName = utils.generateRandomString();

let browser, page;
describe('Components', () => {
    const operationTimeOut = init.timeout;

    beforeAll(async () => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch({
            ...utils.puppeteerLaunchConfig,
        });
        page = await browser.newPage();

        await page.setUserAgent(utils.agent);

        await init.registerUser(user, page);
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test(
        'Should show indicator on how to invite new Team members since no other member exist, then goto team page ',
        async done => {
            // Navigate to home page
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });
            const componentBoxElement = await init.pageWaitForSelector(
                page,
                '#info-teamMember'
            );
            expect(componentBoxElement).toBeDefined();

            let spanElement;
            spanElement = await init.pageWaitForSelector(
                page,
                `span#box-header-teamMember`
            );
            spanElement = await spanElement.getProperty('innerText');
            spanElement = await spanElement.jsonValue();
            spanElement.should.be.exactly('Invite your Team');

            // click on the call to action button
            await init.pageWaitForSelector(page, '#gotoPage-teamMember');
            await init.page$Eval(page, '#gotoPage-teamMember', e => e.click());

            const componentFormElement = await init.pageWaitForSelector(
                page,
                `#teamMemberPage`
            );
            expect(componentFormElement).toBeDefined();
            done();
        },
        operationTimeOut
    );
    test(
        'Should show indicator on how to create a component since no component exist, then goto component creation ',
        async done => {
            // Navigate to home page
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });
            const componentBoxElement = await init.pageWaitForSelector(
                page,
                '#info-component'
            );
            expect(componentBoxElement).toBeDefined();

            let spanElement;
            spanElement = await init.pageWaitForSelector(
                page,
                `span#box-header-component`
            );
            spanElement = await spanElement.getProperty('innerText');
            spanElement = await spanElement.jsonValue();
            spanElement.should.be.exactly('Create your first Component');

            // click on the call to action button
            await init.pageWaitForSelector(page, '#gotoPage-component');
            await init.page$Eval(page, '#gotoPage-component', e => e.click());

            const componentFormElement = await init.pageWaitForSelector(
                page,
                '#form-new-component'
            );
            expect(componentFormElement).toBeDefined();
            done();
        },
        operationTimeOut
    );
    test(
        'Should create new component',
        async done => {
            // Navigate to Components page
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });
            await init.pageWaitForSelector(page, '#components');
            await init.page$Eval(page, '#components', e => e.click());
            // Fill and submit New Component form
            await init.pageWaitForSelector(page, '#form-new-component');
            await init.pageType(page, 'input[id=name]', componentName);
            await init.page$Eval(page, 'button[type=submit]', e => e.click());
            await page.goto(utils.DASHBOARD_URL);
            await init.pageWaitForSelector(page, '#components', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#components', e => e.click());

            let spanElement;
            spanElement = await init.pageWaitForSelector(
                page,
                `span#component-title-${componentName}`
            );
            spanElement = await spanElement.getProperty('innerText');
            spanElement = await spanElement.jsonValue();
            spanElement.should.be.exactly(componentName);
            done();
        },
        operationTimeOut
    );
    test(
        'Should show indicator on how to create a monitor since a component exist, then goto monitor creation',
        async done => {
            // Navigate to home page
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });

            const monitorBoxElement = await init.pageWaitForSelector(
                page,
                '#info-monitor'
            );
            expect(monitorBoxElement).toBeDefined();

            let spanElement;
            spanElement = await init.pageWaitForSelector(
                page,
                `span#box-header-monitor`
            );
            spanElement = await spanElement.getProperty('innerText');
            spanElement = await spanElement.jsonValue();
            spanElement.should.be.exactly('Create a Monitor');

            // click on the call to action button
            await init.pageWaitForSelector(page, '#gotoPage-monitor');
            await init.page$Eval(page, '#gotoPage-monitor', e => e.click());

            // Navigate to Component details
            await init.pageWaitForSelector(
                page,
                `#more-details-${componentName}`
            );
            await init.page$Eval(page, `#more-details-${componentName}`, e =>
                e.click()
            );
            await init.pageWaitForSelector(page, '#form-new-monitor');
            done();
        },
        operationTimeOut
    );

    test(
        'should show the correct path on the breadcrumbs inside a component',
        async done => {
            await page.goto(utils.DASHBOARD_URL);
            await init.pageWaitForSelector(page, '#components', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#components', e => e.click());

            const moreBtn = `#more-details-${componentName}`;
            await init.pageWaitForSelector(page, moreBtn, {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, moreBtn, e => e.click());

            const projectSelector = `#cbUnnamedProject`;
            const componentSelector = `#cb${componentName}`;
            await init.pageWaitForSelector(page, projectSelector, {
                visible: true,
                timeout: init.timeout,
            });
            const projectBreadcrumb = await page.evaluate(
                projectSelector =>
                    document.querySelector(projectSelector).textContent,
                projectSelector
            );
            await init.pageWaitForSelector(page, componentSelector, {
                visible: true,
                timeout: init.timeout,
            });
            const componentBreadcrumb = await page.evaluate(
                componentSelector =>
                    document.querySelector(componentSelector).textContent,
                componentSelector
            );

            expect(projectBreadcrumb).toBe('Unnamed Project');
            expect(componentBreadcrumb).toBe(componentName);

            done();
        },
        operationTimeOut
    );

    test(
        'Should not create new component when details are incorrect',
        async done => {
            // Navigate to Components page
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });
            await init.pageWaitForSelector(page, '#components');
            await init.page$Eval(page, '#components', e => e.click());

            // Fill and submit New Component form with incorrect details
            await init.pageWaitForSelector(page, '#cbComponents');
            await init.pageClick(page, '#newFormId');
            await init.pageWaitForSelector(page, '#form-new-component');
            await init.pageWaitForSelector(page, '#name');
            await init.page$Eval(page, 'button[type=submit]', e => e.click());

            let spanElement = await init.page$(
                page,
                '#form-new-component span#field-error'
            );
            spanElement = await spanElement.getProperty('innerText');
            spanElement = await spanElement.jsonValue();
            spanElement.should.be.exactly('This field cannot be left blank');
            done();
        },
        operationTimeOut
    );
    test(
        'Should show indicator on how to create monitor',
        async done => {
            // Navigate to Component details
            await init.navigateToComponentDetails(componentName, page);

            const customTutorialType = 'monitor';
            // confirm that monitor box exist on component details page
            const componentBoxElement = await init.pageWaitForSelector(
                page,
                `#info-${customTutorialType}`
            );
            expect(componentBoxElement).toBeDefined();
            done();
        },
        operationTimeOut
    );
});
