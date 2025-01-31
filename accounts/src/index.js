import React from 'react';
import { Provider } from 'react-redux';
import { Frontload } from 'react-frontload';
import ReactGA from 'react-ga';
import ErrorBoundary from './components/basic/ErrorBoundary';
import { render } from 'react-dom';
import store, { history, isServer } from './store';
import App from './App';
import './index.css';
import * as serviceWorker from './serviceWorker';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { SENTRY_DSN, VERSION } from './config';

Sentry.init({
    dsn: SENTRY_DSN,
    release: `oneuptime-accounts@${VERSION}`,
    integrations: [new Integrations.BrowserTracing()],
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.0,
});

if (!isServer) {
    ReactGA.initialize('UA-115085157-1');
}
const target = document.getElementById('root');

render(
    <Provider store={store} history={history}>
        <Frontload noServerRender={true}>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </Frontload>
    </Provider>,
    target
);

// this will enable the app to work offline and load faster
serviceWorker.register();
