const express = require('express');
const path = require('path');
const app = express();

const https = require('https');
const http = require('http');
const tls = require('tls');
const fs = require('fs');
const fetch = require('node-fetch');
const { spawn } = require('child_process');
const axios = require('axios');
const cors = require('cors');

// mongodb
const MongoClient = require('mongodb').MongoClient;
const mongoUrl =
    process.env['MONGO_URL'] || 'mongodb://localhost:27017/fyipedb';

const { NODE_ENV } = process.env;

function getMongoClient() {
    return new MongoClient(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}

// setup mongodb connection
const client = getMongoClient();
(async function() {
    try {
        // eslint-disable-next-line no-console
        console.log('connecting to db');
        await client.connect();
        // eslint-disable-next-line no-console
        console.log('connected to db');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log('connection error: ', error);
    }
})();

if (!NODE_ENV || NODE_ENV === 'development') {
    // Load env vars from /statuspage/.env
    require('dotenv').config();
}

app.use(cors());

let apiHost = 'http://localhost:3002/api';
if (process.env.BACKEND_URL) {
    apiHost = 'http://' + process.env.BACKEND_URL + '/api';
}
if (process.env.ONEUPTIME_HOST) {
    apiHost = process.env.BACKEND_PROTOCOL
        ? `${process.env.BACKEND_PROTOCOL}://${process.env.ONEUPTIME_HOST}/api`
        : `http://${process.env.ONEUPTIME_HOST}/api`;
}

app.get(['/env.js', '/status-page/env.js'], function(req, res) {
    let REACT_APP_ONEUPTIME_HOST = null;
    let REACT_APP_BACKEND_PROTOCOL = null;
    if (!process.env.ONEUPTIME_HOST) {
        REACT_APP_ONEUPTIME_HOST = req.hostname;
    } else {
        REACT_APP_ONEUPTIME_HOST = process.env.ONEUPTIME_HOST;
        if (REACT_APP_ONEUPTIME_HOST.includes('*.')) {
            REACT_APP_ONEUPTIME_HOST = REACT_APP_ONEUPTIME_HOST.replace(
                '*.',
                ''
            ); //remove wildcard from host.
        }
    }

    if (
        REACT_APP_ONEUPTIME_HOST &&
        (REACT_APP_ONEUPTIME_HOST.includes('localhost:') ||
            REACT_APP_ONEUPTIME_HOST.includes('0.0.0.0:') ||
            REACT_APP_ONEUPTIME_HOST.includes('127.0.0.1:'))
    ) {
        apiHost = 'http://localhost:3002/api';
    } else if (REACT_APP_ONEUPTIME_HOST) {
        const ONEUPTIME_HOST = REACT_APP_ONEUPTIME_HOST.replace(
            /(http:\/\/|https:\/\/)/,
            ''
        ); // remove any protocol that might have been added
        let protocol = 'http:';
        if (process.env.BACKEND_PROTOCOL) {
            protocol = process.env.BACKEND_PROTOCOL + ':';
        } else if (req.secure) {
            protocol = 'https:';
        }

        apiHost = protocol + `//${ONEUPTIME_HOST}/api`;
    }

    REACT_APP_BACKEND_PROTOCOL = process.env.BACKEND_PROTOCOL;
    const env = {
        REACT_APP_ONEUPTIME_HOST,
        REACT_APP_BACKEND_PROTOCOL,
        REACT_APP_BACKEND_URL: process.env.BACKEND_URL,
        REACT_APP_SENTRY_DSN:
            process.env.SENTRY_DSN || process.env.REACT_APP_SENTRY_DSN,
        REACT_APP_VERSION:
            process.env.REACT_APP_VERSION || process.env.npm_package_version,
    };

    res.contentType('application/javascript');
    res.send('window._env = ' + JSON.stringify(env));
});

app.use('/.well-known/acme-challenge/:token', async function(req, res) {
    // make api call to backend and fetch keyAuthorization
    const { token } = req.params;
    const url = `${apiHost}/ssl/challenge/authorization/${token}`;
    const response = await axios.get(url);
    res.send(response.data);
});

// fetch details about a domain from the db
async function handleCustomDomain(client, collection, domain) {
    const statusPage = await client
        .db('fyipedb')
        .collection(collection)
        .findOne({
            domains: { $elemMatch: { domain } },
            deleted: false,
        });

    let domainObj = {};
    statusPage &&
        statusPage.domains &&
        statusPage.domains.forEach(eachDomain => {
            if (eachDomain.domain === domain) {
                domainObj = eachDomain;
            }
        });

    return {
        cert: domainObj.cert,
        privateKey: domainObj.privateKey,
        autoProvisioning: domainObj.autoProvisioning,
        enableHttps: domainObj.enableHttps,
        domain: domainObj.domain,
    };
}

// fetch certificate for a particular domain
async function handleCertificate(client, collection, domain) {
    const certificate = await client
        .db('fyipedb')
        .collection(collection)
        .findOne({ id: domain });

    return certificate;
}

app.use(async function(req, res, next) {
    const host = req.hostname;
    const completeUrl = `https://${host}${req.url}`;

    try {
        if (host && completeUrl === 'https://fyipe.com/') {
            res.writeHead(301, {
                Location: `https://oneuptime.com?redirectedFromOldBranding=true`,
            });
            return res.end();
        }
        if (host && completeUrl === 'https://staging.fyipe.com/') {
            res.writeHead(301, {
                Location: `https://staging.oneuptime.com?redirectedFromOldBranding=true`,
            });
            return res.end();
        }
        if (host && host === 'fyipe.com') {
            res.writeHead(301, {
                Location: `https://oneuptime.com${req.url}`,
            });
            return res.end();
        }
        if (host && host === 'staging.fyipe.com') {
            res.writeHead(301, {
                Location: `https://staging.oneuptime.com${req.url}`,
            });
            return res.end();
        }

        return next();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Status Page: Error with fetch', error);
        return next();
    }
});

app.use('/', async function(req, res, next) {
    const host = req.hostname;
    if (
        host &&
        (host === 'fyipe.com' ||
            host === 'staging.fyipe.com' ||
            host === 'oneuptime.com' ||
            host === 'staging.oneuptime.com' ||
            host.indexOf('localhost') > -1)
    ) {
        return next();
    }

    try {
        const response = await handleCustomDomain(client, 'statuspages', host);

        const { enableHttps } = response;
        if (enableHttps) {
            if (!req.secure) {
                res.writeHead(301, {
                    Location: `https://${host}${req.url}`,
                });
                return res.end();
            }
            return next();
        } else {
            if (req.secure) {
                res.writeHead(301, {
                    Location: `http://${host}${req.url}`,
                });
                return res.end();
            }
            return next();
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Error with fetch', error);
        return next();
    }
});

app.get(['/status-page/status', '/status'], function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(
        JSON.stringify({
            status: 200,
            message: 'Service Status - OK',
            serviceType: 'oneuptime-status-page',
        })
    );
});

app.use(express.static(path.join(__dirname, 'build')));
app.use('/status-page', express.static(path.join(__dirname, 'build')));
app.use(
    '/status-page/static/js',
    express.static(path.join(__dirname, 'build/static/js'))
);

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

async function fetchCredential(apiHost, credentialName, configPath) {
    return new Promise((resolve, reject) => {
        fetch(`${apiHost}/file/${credentialName}`).then(res => {
            const dest = fs.createWriteStream(configPath);
            res.body.pipe(dest);
            // at this point, writing to the specified file is complete
            dest.on('finish', async () => {
                resolve('done writing to file');
            });

            dest.on('error', async error => {
                reject(error);
            });
        });
    });
}

function decodeAndSave(content, filePath) {
    return new Promise(resolve => {
        const command = `echo ${content} | base64 -d`;
        let output = '';

        const commandOutput = spawn(command, {
            cwd: process.cwd(),
            shell: true,
        });
        commandOutput.stdout.on('data', data => {
            const strData = data.toString();
            output += strData;
        });
        commandOutput.on('close', () => {
            fs.writeFile(filePath, output, 'utf8', function() {
                resolve('Done writing to disc');
            });
        });
    });
}

function createDir(dirPath) {
    return new Promise((resolve, reject) => {
        const workPath = path.resolve(process.cwd(), 'src', dirPath);
        if (fs.existsSync(workPath)) {
            resolve(workPath);
        }

        fs.mkdir(workPath, error => {
            if (error) reject(error);
            resolve(workPath);
        });
    });
}

function countFreq(pat, txt) {
    const M = pat.length;
    const N = txt.length;
    let res = 0;

    // A loop to slide pat[] one by one
    for (let i = 0; i <= N - M; i++) {
        // For current index i, check for
        // pattern match
        let j;
        for (j = 0; j < M; j++) {
            if (txt[i + j] != pat[j]) {
                break;
            }
        }

        if (j == M) {
            res++;
            j = 0;
        }
    }
    return res;
}

// using an IIFE here because we have an asynchronous code we want to run as we start the server
// and since we can't await outside an async function, we had to use an IIFE to handle that
(async function() {
    // create http server
    http.createServer(app).listen(3006, () =>
        // eslint-disable-next-line no-console
        console.log('Server running on port 3006')
    );

    try {
        // create https server
        await createDir('credentials');
        // decode base64 of the cert and private key
        // store the value to disc
        const cert = process.env.STATUSPAGE_CERT;
        const certPath = path.resolve(
            process.cwd(),
            'src',
            'credentials',
            'certificate.crt'
        );
        const privateKey = process.env.STATUSPAGE_PRIVATEKEY;
        const privateKeyPath = path.resolve(
            process.cwd(),
            'src',
            'credentials',
            'private.key'
        );
        await Promise.all([
            decodeAndSave(cert, certPath),
            decodeAndSave(privateKey, privateKeyPath),
        ]);

        const options = {
            cert: fs.readFileSync(
                path.resolve(
                    process.cwd(),
                    'src',
                    'credentials',
                    'certificate.crt'
                )
            ),
            key: fs.readFileSync(
                path.resolve(process.cwd(), 'src', 'credentials', 'private.key')
            ),
            SNICallback: async function(domain, cb) {
                const res = await handleCustomDomain(
                    client,
                    'statuspages',
                    domain
                );

                let certPath, privateKeyPath;
                if (res) {
                    const {
                        cert,
                        privateKey,
                        autoProvisioning,
                        enableHttps,
                        domain,
                    } = res;
                    // have a condition to check for autoProvisioning
                    // if auto provisioning is set
                    // fetch the stored cert/privateKey
                    // cert and private key is a string
                    // store it to a file on disk
                    if (enableHttps && autoProvisioning) {
                        const certificate = await handleCertificate(
                            client,
                            'certificates',
                            domain
                        );
                        if (certificate) {
                            certPath = path.resolve(
                                process.cwd(),
                                'src',
                                'credentials',
                                `${certificate.id}.crt`
                            );
                            privateKeyPath = path.resolve(
                                process.cwd(),
                                'src',
                                'credentials',
                                `${certificate.id}.key`
                            );

                            // check if the certificate is container chain
                            // if not, add anc show update view for the frontend
                            let fullCert = certificate.cert;
                            if (
                                countFreq(
                                    'BEGIN CERTIFICATE',
                                    certificate.cert
                                ) === 1
                            ) {
                                fullCert =
                                    certificate.cert +
                                    '\n' +
                                    '\n' +
                                    certificate.chain;
                            }
                            fs.writeFileSync(certPath, fullCert);
                            fs.writeFileSync(
                                privateKeyPath,
                                certificate.privateKeyPem
                            );

                            return cb(
                                null,
                                tls.createSecureContext({
                                    key: fs.readFileSync(privateKeyPath),
                                    cert: fs.readFileSync(certPath),
                                })
                            );
                        }
                    }

                    if (cert && privateKey) {
                        certPath = path.resolve(
                            process.cwd(),
                            'src',
                            'credentials',
                            `${cert}.crt`
                        );
                        privateKeyPath = path.resolve(
                            process.cwd(),
                            'src',
                            'credentials',
                            `${privateKey}.key`
                        );

                        await Promise.all([
                            fetchCredential(apiHost, cert, certPath),
                            fetchCredential(
                                apiHost,
                                privateKey,
                                privateKeyPath
                            ),
                        ]);

                        return cb(
                            null,
                            tls.createSecureContext({
                                key: fs.readFileSync(privateKeyPath),
                                cert: fs.readFileSync(certPath),
                            })
                        );
                    }
                }

                // default for custom domains without cert/key credentials
                return cb(
                    null,
                    tls.createSecureContext({
                        cert: fs.readFileSync(
                            path.resolve(
                                process.cwd(),
                                'src',
                                'credentials',
                                'certificate.crt'
                            )
                        ),
                        key: fs.readFileSync(
                            path.resolve(
                                process.cwd(),
                                'src',
                                'credentials',
                                'private.key'
                            )
                        ),
                    })
                );
            },
        };

        https.createServer(options, app).listen(3007, () => {
            // eslint-disable-next-line no-console
            console.log('Server running on port 3007');
        });
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Unable to create HTTPS Server');
        // eslint-disable-next-line no-console
        console.log(e);
    }
})();
