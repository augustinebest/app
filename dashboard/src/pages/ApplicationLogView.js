import React, { Component } from 'react';
import Fade from 'react-reveal/Fade';
import { SHOULD_LOG_ANALYTICS } from '../config';
import { logEvent } from '../analytics';
import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import getParentRoute from '../utils/getParentRoute';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import {
    fetchApplicationLogs,
    editApplicationLog,
} from '../actions/applicationLog';
import { fetchComponent } from '../actions/component';
import ApplicationLogDetail from '../components/application/ApplicationLogDetail';
import ApplicationLogViewDeleteBox from '../components/application/ApplicationLogViewDeleteBox';
import ShouldRender from '../components/basic/ShouldRender';
import { LoadingState } from '../components/basic/Loader';
import LibraryList from '../components/application/LibraryList';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

class ApplicationLogView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            show: false,
            tabIndex: 0,
        };
    }
    componentDidMount() {
        if (SHOULD_LOG_ANALYTICS) {
            logEvent(
                'PAGE VIEW: DASHBOARD > PROJECT > COMPONENT > LOG CONTAINERS > LOG CONTAINER DETAIL PAGE'
            );
        }

        this.ready();
    }

    ready = () => {
        const {
            componentSlug,
            fetchComponent,
            componentId,
            fetchApplicationLogs,
            logLimit,
            logSkip,
        } = this.props;
        const projectId =
            this.props.currentProject && this.props.currentProject._id;
        componentSlug && fetchComponent(projectId, componentSlug); // On Page Reload, the state is blank hence componentId is null. ComponentSlug present in URL bar is used to fetch component before the componentId is loaded alongside component.
        if (projectId && componentId) {
            componentId &&
                fetchApplicationLogs(projectId, componentId, logSkip, logLimit);
        }
    };

    componentDidUpdate(prevProps) {
        if (
            String(prevProps.componentSlug) !==
                String(this.props.componentSlug) ||
            prevProps.currentProject !== this.props.currentProject
        ) {
            if (
                this.props.currentProject &&
                this.props.currentProject._id &&
                this.props.componentSlug
            ) {
                this.props.fetchComponent(
                    this.props.currentProject._id,
                    this.props.componentSlug
                );
            }
        }

        if (prevProps.componentId !== this.props.componentId) {
            if (
                this.props.currentProject &&
                this.props.currentProject._id &&
                this.props.componentId
            ) {
                this.props.fetchApplicationLogs(
                    this.props.currentProject._id,
                    this.props.componentId,
                    this.props.logSkip,
                    this.props.logLimit
                );
            }
        }
    }

    handleCloseQuickStart = () => {
        const postObj = { showQuickStart: false };
        const projectId = this.props.currentProject
            ? this.props.currentProject._id
            : null;
        const { applicationLog } = this.props;
        this.props.editApplicationLog(
            projectId,
            applicationLog[0].componentId._id,
            applicationLog[0]._id,
            postObj
        );
    };

    tabSelected = index => {
        const tabSlider = document.getElementById('tab-slider');

        setTimeout(() => {
            tabSlider.style.transform = `translate(calc(${tabSlider.offsetWidth}px*${index}), 0px)`;
        });
        this.setState({ tabIndex: index });
    };
    render() {
        const {
            location: { pathname },
            component,
            componentId,
            applicationLog,
            currentProject,
            switchToProjectViewerNav,
        } = this.props;

        const componentName = component ? component.name : '';
        const applicationLogName =
            applicationLog.length > 0 ? applicationLog[0].name : null;
        const projectName = currentProject ? currentProject.name : '';
        const projectId = currentProject ? currentProject._id : '';
        return (
            <Fade>
                <BreadCrumbItem
                    route="/"
                    name={projectName}
                    projectId={projectId}
                    slug={currentProject ? currentProject.slug : null}
                    switchToProjectViewerNav={switchToProjectViewerNav}
                />
                <BreadCrumbItem
                    route={getParentRoute(pathname, null, 'application-log')}
                    name={componentName}
                />
                <BreadCrumbItem
                    route={getParentRoute(pathname, null, 'application-logs')}
                    name="Logs"
                />
                <BreadCrumbItem
                    route={pathname}
                    name={applicationLogName}
                    pageTitle="Logs"
                    containerType="Log Container"
                />
                <ShouldRender if={!this.props.applicationLog[0]}>
                    <LoadingState />
                </ShouldRender>
                <ShouldRender if={this.props.applicationLog[0]}>
                    <Tabs
                        selectedTabClassName={'custom-tab-selected'}
                        onSelect={tab => this.tabSelected(tab)}
                        selectedIndex={this.state.tabIndex}
                    >
                        <div className="Flex-flex Flex-direction--columnReverse">
                            <TabList
                                id="customTabList"
                                className={'custom-tab-list'}
                            >
                                <Tab
                                    className={
                                        'custom-tab custom-tab-6 basic-tab bs-automate-tab'
                                    }
                                >
                                    Basic
                                </Tab>
                                <Tab
                                    className={
                                        'custom-tab custom-tab-6 advanced-options-tab bs-automate-tab'
                                    }
                                >
                                    Advanced Options
                                </Tab>
                                <div
                                    id="tab-slider"
                                    className="custom-tab-6 status-tab bs-automate-slider"
                                ></div>
                            </TabList>
                        </div>
                        <div className="Box-root">
                            <div>
                                <div>
                                    <div className="db-BackboneViewContainer">
                                        <div className="react-settings-view react-view">
                                            <span data-reactroot="">
                                                <div>
                                                    <div>
                                                        <TabPanel>
                                                            <Fade>
                                                                <div className="bs-ContentSection Card-root Card-shadow--medium Margin-bottom--12">
                                                                    {applicationLog[0] &&
                                                                    applicationLog[0]
                                                                        .showQuickStart ? (
                                                                        <ShouldRender
                                                                            if={
                                                                                this
                                                                                    .state
                                                                                    .show
                                                                            }
                                                                        >
                                                                            <LibraryList
                                                                                title="Log Container"
                                                                                type="logs"
                                                                                applicationLog={
                                                                                    this
                                                                                        .props
                                                                                        .applicationLog[0]
                                                                                }
                                                                                close={
                                                                                    this
                                                                                        .handleCloseQuickStart
                                                                                }
                                                                                setShow={() =>
                                                                                    this.setState(
                                                                                        {
                                                                                            show: false,
                                                                                        }
                                                                                    )
                                                                                }
                                                                            />
                                                                        </ShouldRender>
                                                                    ) : null}
                                                                    <ShouldRender
                                                                        if={
                                                                            !this
                                                                                .state
                                                                                .show
                                                                        }
                                                                    >
                                                                        <div>
                                                                            <ApplicationLogDetail
                                                                                componentId={
                                                                                    componentId
                                                                                }
                                                                                index={
                                                                                    this
                                                                                        .props
                                                                                        .applicationLog[0]
                                                                                        ?._id
                                                                                }
                                                                                isDetails={
                                                                                    true
                                                                                }
                                                                                componentSlug={
                                                                                    this
                                                                                        .props
                                                                                        .componentSlug
                                                                                }
                                                                                setShow={() =>
                                                                                    this.setState(
                                                                                        {
                                                                                            show: true,
                                                                                        }
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </ShouldRender>
                                                                </div>
                                                            </Fade>
                                                        </TabPanel>
                                                        <TabPanel>
                                                            <Fade>
                                                                <div className="bs-ContentSection Card-root Card-shadow--medium Margin-bottom--12">
                                                                    <div className="Box-root Margin-bottom--12">
                                                                        <ApplicationLogViewDeleteBox
                                                                            componentId={
                                                                                this
                                                                                    .props
                                                                                    .componentId
                                                                            }
                                                                            applicationLog={
                                                                                this
                                                                                    .props
                                                                                    .applicationLog[0]
                                                                            }
                                                                            componentSlug={
                                                                                this
                                                                                    .props
                                                                                    .componentSlug
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </Fade>
                                                        </TabPanel>
                                                    </div>
                                                </div>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Tabs>
                </ShouldRender>
            </Fade>
        );
    }
}

ApplicationLogView.displayName = 'ApplicationLogView';

const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        { fetchApplicationLogs, editApplicationLog, fetchComponent },
        dispatch
    );
};
const mapStateToProps = (state, props) => {
    const { componentSlug, applicationLogSlug } = props.match.params;
    const applicationLog = state.applicationLog.applicationLogsList.applicationLogs.filter(
        applicationLog => applicationLog.slug === applicationLogSlug
    );
    return {
        componentId:
            state.component.currentComponent.component &&
            state.component.currentComponent.component._id,
        applicationLog,
        componentSlug,
        component:
            state.component && state.component.currentComponent.component,
        currentProject: state.project.currentProject,
        switchToProjectViewerNav: state.project.switchToProjectViewerNav,
        logSkip: state.applicationLog.applicationLogsList.skip || 0,
        logLimit: state.applicationLog.applicationLogsList.limit || 5,
    };
};

ApplicationLogView.propTypes = {
    location: PropTypes.shape({
        pathname: PropTypes.string,
    }),
    component: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
        })
    ),
    componentId: PropTypes.string,
    fetchComponent: PropTypes.func,
    componentSlug: PropTypes.string,
    fetchApplicationLogs: PropTypes.func,
    currentProject: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.oneOf([null, undefined]),
    ]),
    applicationLog: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.string,
            name: PropTypes.string,
            showQuickStart: PropTypes.bool,
            componentId: PropTypes.object,
        })
    ),
    editApplicationLog: PropTypes.func,
    switchToProjectViewerNav: PropTypes.bool,
    logSkip: PropTypes.number,
    logLimit: PropTypes.number,
};

export default connect(mapStateToProps, mapDispatchToProps)(ApplicationLogView);
