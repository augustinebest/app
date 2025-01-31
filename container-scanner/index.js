const { NODE_ENV } = process.env;

if (!NODE_ENV || NODE_ENV === 'development') {
    // Load env vars from /backend/.env
    require('custom-env').env();
}

process.on('exit', () => {
    // eslint-disable-next-line no-console
    console.log('Container Scanner Shutting Shutdown');
});

process.on('unhandledRejection', err => {
    // eslint-disable-next-line no-console
    console.error('Unhandled rejection in container scanner process occurred');
    // eslint-disable-next-line no-console
    console.error(err);
});

process.on('uncaughtException', err => {
    // eslint-disable-next-line no-console
    console.error('Uncaught exception in container scanner process occurred');
    // eslint-disable-next-line no-console
    console.error(err);
});

const express = require('express');
const Sentry = require('@sentry/node');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors');
const Main = require('./worker/main');
const cron = require('node-cron');
const config = require('./utils/config');

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: `container-scanner@${process.env.npm_package_version}`,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.0,
    integrations: [
        new Sentry.Integrations.OnUncaughtException({
            onFatalError() {
                // override default behaviour
                return;
            },
        }),
    ],
});

// Sentry: The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

const cronContainerSecurityStartTime = Math.floor(Math.random() * 50);

app.use(cors());
app.set('port', process.env.PORT || 3055);

app.get(['/container/status', '/status'], function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(
        JSON.stringify({
            status: 200,
            message: 'Service Status - OK',
            serviceType: 'oneuptime-container-scanner',
        })
    );
});

//App Version
app.get(['/container/version', '/version'], function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({ containerScannerVersion: process.env.npm_package_version });
});

app.use(Sentry.Handlers.errorHandler());
global.Sentry = Sentry;

//Run this cron every 5 minute.
cron.schedule('*/5 * * * *', () => {
    setTimeout(() => {
        Main.runContainerScan();
    }, cronContainerSecurityStartTime * 1000);
});

http.listen(app.get('port'), function() {
    // eslint-disable-next-line
    console.log(
        `Container Scanner Started on port ${app.get(
            'port'
        )}. OneUptime API URL: ${config.serverUrl}`
    );
});

module.exports = app;
