import React from 'react';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import Fade from 'react-reveal/Fade';
import { connect } from 'react-redux';
import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import getParentRoute from '../utils/getParentRoute';
import { openModal, closeModal } from '../actions/modal';
import MonitorSla from '../components/monitorSla/MonitorSla';
import { Tab, Tabs, TabList, TabPanel, resetIdCounter } from 'react-tabs';
import { fetchCustomFields } from '../actions/monitorCustomField';
import MonitorCustomFields from '../components/monitor/MonitorCustomFields';

class MonitorSettings extends React.Component {
    state = {
        tabIndex: 0,
    };

    ready = () => {
        const { fetchCustomFields } = this.props;
        fetchCustomFields(
            this.props.currentProject && this.props.currentProject._id,
            0,
            10
        );
    };

    componentDidMount() {
        this.ready();
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps?.currentProject?._id !== this.props?.currentProject?._id
        ) {
            this.ready();
        }
    }

    componentWillMount() {
        resetIdCounter();
    }

    tabSelected = index => {
        const tabSlider = document.getElementById('tab-slider');
        tabSlider.style.transform = `translate(calc(${tabSlider.offsetWidth}px*${index}), 0px)`;
        this.setState({
            tabIndex: index,
        });
    };

    render() {
        const {
            location: { pathname },
            currentProject,
            switchToProjectViewerNav,
        } = this.props;
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
                    route={getParentRoute(pathname)}
                    name="Project Settings"
                />
                <div id="monitorSettingsPage">
                    <BreadCrumbItem route={pathname} name="Monitors" />

                    <div>
                        <Tabs
                            selectedTabClassName={'custom-tab-selected'}
                            onSelect={tabIndex => this.tabSelected(tabIndex)}
                            selectedIndex={this.state.tabIndex}
                        >
                            <div className="Flex-flex Flex-direction--columnReverse">
                                <TabList
                                    id="customTabList"
                                    className={'custom-tab-list'}
                                >
                                    <Tab
                                        className={
                                            'custom-tab custom-tab-2 monitor-sla'
                                        }
                                    >
                                        Monitor SLA
                                    </Tab>
                                    <Tab
                                        className={
                                            'custom-tab custom-tab-2 monitor-sla-advanced'
                                        }
                                    >
                                        Advanced
                                    </Tab>
                                    <div
                                        id="tab-slider"
                                        className="custom-tab-2"
                                    ></div>
                                </TabList>
                            </div>
                            <TabPanel>
                                <Fade>
                                    <MonitorSla
                                        projectId={
                                            this.props.currentProject &&
                                            this.props.currentProject._id
                                        }
                                    />
                                </Fade>
                            </TabPanel>
                            <TabPanel>
                                <Fade>
                                    <MonitorCustomFields
                                        projectId={
                                            this.props.currentProject &&
                                            this.props.currentProject._id
                                        }
                                    />
                                </Fade>
                            </TabPanel>
                        </Tabs>
                    </div>
                </div>
            </Fade>
        );
    }
}

MonitorSettings.displayName = 'MonitorSettings';
MonitorSettings.propTypes = {
    location: PropTypes.object.isRequired,
    fetchCustomFields: PropTypes.func,
    currentProject: PropTypes.object,
    switchToProjectViewerNav: PropTypes.bool,
};
const mapStateToProps = state => {
    return {
        currentProject: state.project.currentProject,
        switchToProjectViewerNav: state.project.switchToProjectViewerNav,
    };
};
const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            openModal,
            closeModal,
            fetchCustomFields,
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(MonitorSettings);
