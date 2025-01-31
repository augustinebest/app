import React, { Suspense, useEffect } from 'react';
import { Router, Route, Redirect, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import store, { history, isServer } from './store';
import { connect } from 'react-redux';
import { allRoutes } from './routes';
import NotFound from './components/404';
import './components/Dashboard';
import BackboneModals from './containers/BackboneModals';
import Socket from './components/basic/Socket';
import ReactGA from 'react-ga';
import { User, ACCOUNTS_URL } from './config';
import Cookies from 'universal-cookie';
import 'font-awesome/css/font-awesome.min.css';
import { loadPage } from './actions/page';
import { setUserId, setUserProperties, identify, logEvent } from './analytics';
import { SHOULD_LOG_ANALYTICS } from './config';
import Dashboard from './components/Dashboard';
import { LoadingState } from './components/basic/Loader';
import 'react-big-calendar/lib/sass/styles.scss';
import isSubProjectViewer from './utils/isSubProjectViewer';

if (!isServer) {
    history.listen(location => {
        ReactGA.set({ page: location.pathname });
        ReactGA.pageview(location.pathname);
    });
}

const cookies = new Cookies();
const userData = cookies.get('data');

if (userData !== undefined) {
    User.setUserId(userData.id);
    User.setAccessToken(userData.tokens.jwtAccessToken);
    User.setEmail(userData.email);
    User.setName(userData.name);
    User.setCardRegistered(userData.cardRegistered);
    if (SHOULD_LOG_ANALYTICS) {
        setUserId(userData.id);
        identify(userData.id);
        setUserProperties({
            Name: userData.name,
            Created: new Date(),
            Email: userData.email,
        });
        logEvent('PAGE VIEW: DASHBOARD');
    }
} else {
    // store original destination url
    const redirectTo = window.location.href;
    window.location = ACCOUNTS_URL + `/login?redirectTo=${redirectTo}`;
    store.dispatch(loadPage('Home'));
}

if (User.isLoggedIn()) {
    const id = User.getUserId();
    if (SHOULD_LOG_ANALYTICS) {
        setUserId(id);
    }
}

const App = props => {
    const oldHostNames = ['staging.fyipe.com', 'fyipe.com'];
    const currentHostName = window.location.hostname;

    if (oldHostNames.includes(currentHostName)) {
        const updatedLink = `${window.location.origin.replace(
            'fyipe',
            'oneuptime'
        )}${window.location.pathname}`;

        window.location.replace(updatedLink);
    }

    const hideProjectNav =
        props.currentProject?._id !== props.activeSubProjectId;
    const titleToExclude = [
        'Project Settings',
        'Resources',
        'Billing',
        'Integrations',
        'API',
        'Advanced',
        'More',
        'Domains',
        'Monitor',
        'Incident Settings',
        'Email',
        'SMS & Calls',
        'Call Routing',
        'Webhooks',
        'Probe',
        'Git Credentials',
        'Docker Credentials',
        'Team Groups',
    ];

    let sortedRoutes = [...allRoutes];
    if (hideProjectNav) {
        sortedRoutes = sortedRoutes.filter(
            router =>
                !titleToExclude.includes(router.title) ||
                router.path ===
                    '/dashboard/project/:slug/component/:componentSlug/settings/advanced'
        );
    }

    useEffect(() => {
        const user = User.getUserId();
        const isViewer = isSubProjectViewer(user, props.activeProject);
        if (isViewer && props.currentProject) {
            history.replace(
                `/dashboard/project/${props.currentProject.slug}/status-pages`
            );
        }
    }, [
        props.currentProject?.slug,
        props.activeSubProjectId,
        props.activeProject?._id,
    ]);

    return (
        <div style={{ height: '100%' }}>
            <Socket />
            <Router history={history}>
                <Dashboard>
                    <Suspense fallback={<LoadingState />}>
                        <Switch>
                            {sortedRoutes
                                .filter(route => route.visible)
                                .map((route, index) => {
                                    return (
                                        <Route
                                            exact={route.exact}
                                            path={route.path}
                                            key={index}
                                            render={props => (
                                                <route.component
                                                    icon={route.icon}
                                                    {...props}
                                                />
                                            )}
                                        />
                                    );
                                })}
                            {hideProjectNav &&
                                props.currentProject &&
                                allRoutes
                                    .filter(
                                        route =>
                                            titleToExclude.includes(
                                                route.title
                                            ) &&
                                            route.path !==
                                                '/dashboard/project/:slug/component/:componentSlug/settings/advanced'
                                    )
                                    .map((route, index) => (
                                        <Route
                                            key={index}
                                            exact
                                            path={route.path}
                                            render={() => (
                                                <Redirect
                                                    to={`/dashboard/project/${props.currentProject.slug}`}
                                                />
                                            )}
                                        />
                                    ))}
                            <Route
                                path={'/dashboard/:404_path'}
                                key={'404'}
                                component={NotFound}
                            />
                            <Redirect to="/dashboard/project/project" />
                        </Switch>
                    </Suspense>
                </Dashboard>
            </Router>
            <BackboneModals />
        </div>
    );
};

App.displayName = 'App';

function mapStateToProps(state) {
    const currentProject = state.project.currentProject;
    const subProjects = state.subProject.subProjects.subProjects;
    const activeSubProjectId = state.subProject.activeSubProject;
    const allProjects = [...subProjects];
    if (currentProject) {
        allProjects.push(currentProject);
    }

    const activeProject = allProjects.find(
        project => String(project._id) === String(activeSubProjectId)
    );

    return {
        ...state.login,
        currentProject: state.project.currentProject,
        activeSubProjectId: state.subProject.activeSubProject,
        activeProject,
    };
}

App.propTypes = {
    currentProject: PropTypes.object,
    activeSubProjectId: PropTypes.string,
    activeProject: PropTypes.object,
};

export default connect(mapStateToProps)(App);
