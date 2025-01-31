#!/usr/bin/env node
'use strict';

// See https://git.coolaj86.com/coolaj86/acme-challenge-test.js
const tester = require('acme-challenge-test');
require('dotenv').config();

// Usage: node ./test.js example.com username xxxxxxxxx
const record = process.argv[2] || process.env.RECORD;
const challenger = require('./index.js').create({});

// The dry-run tests can pass on, literally, 'example.com'
// but the integration tests require that you have control over the domain

tester
    .testRecord('http-01', record, challenger)
    .then(function() {
        // eslint-disable-next-line no-console
        console.info('PASS', record);
    })
    .catch(function(e) {
        // eslint-disable-next-line no-console
        console.error(e.message);
        // eslint-disable-next-line no-console
        console.error(e.stack);
    });
