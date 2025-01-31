import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { destroy } from 'redux-form';
import Fade from 'react-reveal/Fade';
import NewComponent from '../components/component/NewComponent';
import ComponentList from '../components/component/ComponentList';
import ShouldRender from '../components/basic/ShouldRender';
import RenderIfSubProjectAdmin from '../components/basic/RenderIfSubProjectAdmin';
import RenderIfSubProjectMember from '../components/basic/RenderIfSubProjectMember';
import { LoadingState } from '../components/basic/Loader';
import TutorialBox from '../components/tutorial/TutorialBox';
import PropTypes from 'prop-types';
import {
    fetchMonitors,
    fetchMonitorsIncidents,
    fetchMonitorLogs,
} from '../actions/monitor';
import { loadPage } from '../actions/page';
import { getSmtpConfig } from '../actions/smsTemplates';
import IsUserInSubProject from '../components/basic/IsUserInSubProject';
import { logEvent } from '../analytics';
import { IS_SAAS_SERVICE } from '../config';
import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import AlertDisabledWarning from '../components/settings/AlertDisabledWarning';
import CustomTutorial from '../components/tutorial/CustomTutorial';
import {
    fetchComponents,
    fetchPaginatedComponents,
} from '../actions/component';

class ComponentDashboardView extends Component {
    state = {
        showNewComponentForm: false,
        page: {},
    };

    prevClicked = (projectId, skip, limit) => {
        this.props
            .fetchPaginatedComponents({
                projectId,
                skip: (skip || 0) > (limit || 3) ? skip - limit : 0,
                limit,
            })
            .then(() => {
                this.setState(prevState => {
                    const updatedPage = prevState.page;
                    updatedPage[projectId] =
                        !updatedPage[projectId] || updatedPage[projectId] === 1
                            ? 1
                            : updatedPage[projectId] - 1;

                    return { page: updatedPage };
                });
            });
    };

    nextClicked = (projectId, skip, limit) => {
        this.props
            .fetchPaginatedComponents({
                projectId,
                skip: skip + limit,
                limit,
            })
            .then(() => {
                this.setState(prevState => {
                    const updatedPage = prevState.page;
                    updatedPage[projectId] = !updatedPage[projectId]
                        ? 2
                        : updatedPage[projectId] + 1;

                    return { page: updatedPage };
                });
            });
    };

    componentDidMount() {
        this.props.loadPage('Components');
        if (IS_SAAS_SERVICE) {
            logEvent('PAGE VIEW: DASHBOARD > PROJECT > COMPONENT');
        }

        this.ready();
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps?.currentProject?._id !== this.props?.currentProject?._id
        ) {
            this.ready();
        }

        if (prevProps?.activeProjectId !== this.props?.activeProjectId) {
            this.ready();
        }
    }

    componentWillUnmount() {
        this.props.destroy('NewComponent');
    }

    toggleForm = () => {
        this.setState(prevState => ({
            showNewComponentForm: !prevState.showNewComponentForm,
        }));
    };

    ready = () => {
        const { activeProjectId } = this.props;
        const currentProjectId = this.props.currentProject
            ? this.props.currentProject._id
            : null;
        this.props.fetchComponents({ projectId: activeProjectId });
        this.props.getSmtpConfig(currentProjectId);
        this.props.fetchMonitors(activeProjectId).then(() => {
            this.props.monitor.monitorsList.monitors.forEach(subProject => {
                if (subProject.monitors.length > 0) {
                    subProject.monitors.forEach(monitor => {
                        this.props.fetchMonitorLogs(
                            monitor.projectId._id || monitor.projectId,
                            monitor._id,
                            this.props.startDate,
                            this.props.endDate
                        );
                        this.props.fetchMonitorsIncidents(
                            monitor.projectId._id || monitor.projectId,
                            monitor._id,
                            0,
                            1
                        );
                    });
                }
            });
        });
    };

    render() {
        if (this.props.currentProject) {
            document.title = this.props.currentProject.name + ' Dashboard';
        }

        if (this.props.components.length) {
            const scriptElement = document.createElement('script');
            scriptElement.type = 'text/javascript';
            scriptElement.src = '/dashboard/assets/js/landing.base.js';
            document.head.appendChild(scriptElement);
        }

        const {
            currentProject,
            location: { pathname },
            switchToProjectViewerNav,
            activeProjectId,
        } = this.props;
        const currentProjectId = activeProjectId;
        let allComponents = this.props.component.componentList.components
            .map(component => component.components)
            .flat();

        // Add Project Components to Components List
        let projectComponent = this.props.component.componentList.components.find(
            subProjectComponent =>
                String(subProjectComponent._id) === String(currentProjectId)
        );
        allComponents = IsUserInSubProject(currentProject)
            ? allComponents
            : allComponents.filter(
                  component =>
                      component.projectId !== currentProject._id ||
                      component.projectId._id !== currentProject._id
              );
        projectComponent =
            projectComponent && projectComponent.components.length > 0 ? (
                <div
                    id={`box_${currentProject.name}`}
                    key={`box_${currentProject.name}`}
                    className="Box-root Margin-vertical--12"
                >
                    <div
                        className="db-Trends Card-root"
                        style={{ overflow: 'visible' }}
                    >
                        <ComponentList
                            shouldRenderProjectType={false}
                            projectId={currentProjectId}
                            projectType={'project'}
                            projectName={'Project'}
                            components={projectComponent.components}
                            skip={projectComponent.skip}
                            count={projectComponent.count}
                            limit={projectComponent.limit}
                            page={this.state.page[currentProjectId]}
                            prevClicked={this.prevClicked}
                            nextClicked={this.nextClicked}
                            requestErrorObject={
                                this.props.component.componentList[
                                    currentProjectId
                                ]
                            }
                        />
                    </div>
                </div>
            ) : (
                false
            );

        const components = projectComponent && [projectComponent];
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
                    route={pathname}
                    name="Components"
                    addBtn={components.length > 0 && components[0] !== false}
                    btnText="Create New Component"
                    toggleForm={this.toggleForm}
                />
                <ShouldRender
                    if={this.props.monitors && this.props.monitors.length > 0}
                >
                    <AlertDisabledWarning page="Component" />
                </ShouldRender>
                <div className="Box-root">
                    <div>
                        <div>
                            <div className="db-BackboneViewContainer">
                                <div className="dashboard-home-view react-view">
                                    <div>
                                        <div>
                                            <span>
                                                <ShouldRender
                                                    if={
                                                        !(
                                                            this.props.component
                                                                .componentList
                                                                .requesting ||
                                                            this.props
                                                                .monitorListRequesting ||
                                                            this.props
                                                                .monitorsRequesting
                                                        )
                                                    }
                                                >
                                                    {/* Here, component notifier */}
                                                    <CustomTutorial
                                                        components={
                                                            allComponents
                                                        }
                                                        tutorialStat={
                                                            this.props
                                                                .tutorialStat
                                                        }
                                                        currentProjectId={
                                                            currentProjectId
                                                        }
                                                        slug={this.props.slug}
                                                        hideActionButton={true}
                                                    />
                                                    <ShouldRender
                                                        if={
                                                            (!this.props
                                                                .tutorialStat
                                                                .componentCustom
                                                                .show ||
                                                                allComponents.length >
                                                                    0) &&
                                                            this.props
                                                                .tutorialStat
                                                                .component.show
                                                        }
                                                    >
                                                        <TutorialBox
                                                            type="component"
                                                            currentProjectId={
                                                                currentProjectId
                                                            }
                                                        />
                                                    </ShouldRender>

                                                    {!this.state
                                                        .showNewComponentForm &&
                                                        components &&
                                                        components.length > 0 &&
                                                        components}

                                                    <RenderIfSubProjectAdmin>
                                                        <ShouldRender
                                                            if={
                                                                this.state
                                                                    .showNewComponentForm ||
                                                                !components ||
                                                                components.length ===
                                                                    0 ||
                                                                components[0] ===
                                                                    false
                                                            }
                                                        >
                                                            <NewComponent
                                                                index={1000}
                                                                formKey="NewComponentForm"
                                                                toggleForm={
                                                                    this
                                                                        .toggleForm
                                                                }
                                                                showCancelBtn={
                                                                    components.length >
                                                                        0 &&
                                                                    components[0] !==
                                                                        false
                                                                }
                                                            />
                                                        </ShouldRender>
                                                    </RenderIfSubProjectAdmin>

                                                    <RenderIfSubProjectMember>
                                                        <ShouldRender
                                                            if={
                                                                !this.props
                                                                    .component
                                                                    .componentList
                                                                    .requesting &&
                                                                allComponents.length ===
                                                                    0
                                                            }
                                                        >
                                                            <div className="Box-root ">
                                                                <div className="db-Trends bs-ContentSection Card-root Card-shadow--small">
                                                                    <div className="Box-root Card-shadow--medium Border-radius--4">
                                                                        <div
                                                                            className="bs-ContentSection-content Box-root Padding-horizontal--20 Padding-vertical--12"
                                                                            style={{
                                                                                paddingBottom:
                                                                                    '100px',
                                                                                paddingTop:
                                                                                    '100px',
                                                                            }}
                                                                        >
                                                                            <div
                                                                                className="db-SideNav-icon db-SideNav-icon--square "
                                                                                style={{
                                                                                    backgroundRepeat:
                                                                                        'no-repeat',
                                                                                    backgroundSize:
                                                                                        'contain',
                                                                                    backgroundPosition:
                                                                                        'center',
                                                                                    height:
                                                                                        '40px',
                                                                                    width:
                                                                                        '40px',
                                                                                    marginRight:
                                                                                        '50%',
                                                                                    marginLeft:
                                                                                        '50%',
                                                                                }}
                                                                            ></div>
                                                                            <div
                                                                                style={{
                                                                                    width:
                                                                                        '100%',
                                                                                    padding:
                                                                                        '10px',
                                                                                    textAlign:
                                                                                        'center',
                                                                                }}
                                                                            >
                                                                                No
                                                                                components
                                                                                are
                                                                                added
                                                                                to
                                                                                this
                                                                                project.
                                                                                Please
                                                                                contact
                                                                                your
                                                                                project
                                                                                admin.
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </ShouldRender>
                                                    </RenderIfSubProjectMember>
                                                </ShouldRender>

                                                <ShouldRender
                                                    if={
                                                        this.props.component
                                                            .componentList
                                                            .requesting ||
                                                        this.props
                                                            .monitorListRequesting ||
                                                        this.props
                                                            .monitorsRequesting
                                                    }
                                                >
                                                    <LoadingState />
                                                </ShouldRender>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Fade>
        );
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            destroy,
            fetchMonitors,
            loadPage,
            fetchMonitorsIncidents,
            fetchMonitorLogs,
            getSmtpConfig,
            fetchComponents,
            fetchPaginatedComponents,
        },
        dispatch
    );
};

const mapStateToProps = state => {
    // removal of unused props
    const component = state.component;
    let subProjects = state.subProject.subProjects.subProjects;
    let monitors = [];

    // sort subprojects names for display in alphabetical order
    const subProjectNames =
        subProjects && subProjects.map(subProject => subProject.name);
    subProjectNames && subProjectNames.sort();
    subProjects =
        subProjectNames &&
        subProjectNames.map(name =>
            subProjects.find(subProject => subProject.name === name)
        );
    state.monitor.monitorsList.monitors.map(monitor => {
        monitors = monitors.concat(...monitor.monitors);
        return monitor;
    });

    const projectId =
        state.project.currentProject && state.project.currentProject._id;

    // try to get custom project tutorial by project ID
    const projectCustomTutorial = state.tutorial[projectId];

    // set a default show to true for the tutorials to display
    const tutorialStat = {
        componentCustom: { show: true },
        component: { show: true },
    };
    // loop through each of the tutorial stat, if they have a value based on the project id, replace it with it
    for (const key in tutorialStat) {
        if (projectCustomTutorial && projectCustomTutorial[key]) {
            tutorialStat[key].show = projectCustomTutorial[key].show;
        }
    }

    return {
        component,
        currentProject: state.project.currentProject,
        incidents: state.incident.unresolvedincidents.incidents,
        components: state.component.componentList.components,
        subProjects,
        slug: state.project.currentProject && state.project.currentProject.slug,
        monitor: state.monitor,
        startDate: state.monitor.monitorsList.startDate,
        endDate: state.monitor.monitorsList.endDate,
        monitors,
        tutorialStat,
        monitorListRequesting: state.monitor.monitorsList.requesting,
        monitorsRequesting: state.monitor.monitorsList.monitors.requesting,
        switchToProjectViewerNav: state.project.switchToProjectViewerNav,
        activeProjectId: state.subProject?.activeSubProject,
    };
};

ComponentDashboardView.propTypes = {
    currentProject: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.oneOf([null, undefined]),
    ]),
    component: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.oneOf([null, undefined]),
    ]),
    components: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.oneOf([null, undefined]),
    ]),
    loadPage: PropTypes.func,
    destroy: PropTypes.func.isRequired,
    fetchMonitors: PropTypes.func.isRequired,
    slug: PropTypes.string,
    location: PropTypes.shape({
        pathname: PropTypes.string,
    }),
    fetchMonitorsIncidents: PropTypes.func,
    fetchMonitorLogs: PropTypes.func,
    monitor: PropTypes.object,
    startDate: PropTypes.object,
    endDate: PropTypes.object,
    monitors: PropTypes.array,
    tutorialStat: PropTypes.object,
    getSmtpConfig: PropTypes.func.isRequired,
    fetchComponents: PropTypes.func,
    monitorListRequesting: PropTypes.bool,
    monitorsRequesting: PropTypes.bool,
    switchToProjectViewerNav: PropTypes.bool,
    fetchPaginatedComponents: PropTypes.func,
    activeProjectId: PropTypes.string,
};

ComponentDashboardView.displayName = 'ComponentDashboardView';

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ComponentDashboardView);
