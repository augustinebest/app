import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Fade from 'react-reveal/Fade';
import Dashboard from '../components/Dashboard';
import { loadPage } from '../actions/page';
import { logEvent } from '../analytics';
import { userScheduleRequest, fetchUserSchedule } from '../actions/schedule';
import { IS_SAAS_SERVICE } from '../config';
import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import AlertDisabledWarning from '../components/settings/AlertDisabledWarning';
import ShouldRender from '../components/basic/ShouldRender';
import { LoadingState } from '../components/basic/Loader';
import _ from 'lodash';
import moment from 'moment-timezone';
import OnCallSchedule from '../components/onCall/OnCallSchedule';
import RenderIfUserInSubProject from '../components/basic/RenderIfUserInSubProject';
import IncidentStatus from '../components/incident/IncidentStatus';

class Home extends Component {
    componentDidMount() {
        this.props.loadPage('Home');
        if (IS_SAAS_SERVICE) {
            logEvent('PAGE VIEW: DASHBOARD > PROJECT > HOME');
        }
        this.props.userScheduleRequest();
        if (this.props.currentProjectId && this.props.user.id) {
            this.props.fetchUserSchedule(
                this.props.currentProjectId,
                this.props.user.id
            );
        }
    }

    componentDidUpdate(prevProps) {
        if (
            (!prevProps.user.id &&
                this.props.currentProjectId &&
                this.props.user.id) ||
            (prevProps.currentProjectId !== this.props.currentProjectId &&
                this.props.user.id)
        ) {
            this.props.fetchUserSchedule(
                this.props.currentProjectId,
                this.props.user.id
            );
        }
    }

    render() {
        const {
            escalations,
            location: { pathname },
        } = this.props;

        const userSchedules = _.flattenDeep(
            escalations.map(escalation => {
                return escalation.teams
                    .map(team => {
                        const schedule = team.teamMembers
                            .map(teamMember => teamMember)
                            .filter(user => user.userId === this.props.user.id)
                            .pop();
                        if (schedule) {
                            schedule.projectId = escalation.projectId;
                            schedule.scheduleId = escalation.scheduleId;
                        }
                        return schedule;
                    })
                    .filter(escalation => escalation);
            })
        );

        const activeSchedules = [];
        const upcomingSchedules = [];
        const inactiveSchedules = [];

        if (userSchedules && userSchedules.length > 0) {
            userSchedules.forEach(userSchedule => {
                const now = (userSchedule && userSchedule.timezone
                    ? moment().tz(userSchedule.timezone)
                    : moment()
                ).format('HH:mm');
                const dayStart = moment().startOf('day');
                const dayEnd = moment().endOf('day');

                const startTime = (userSchedule && userSchedule.timezone
                    ? moment(userSchedule.startTime || dayStart).tz(
                          userSchedule.timezone
                      )
                    : moment(userSchedule.startTime || dayStart)
                ).format('HH:mm');
                const endTime = (userSchedule && userSchedule.timezone
                    ? moment(userSchedule.endTime || dayEnd).tz(
                          userSchedule.timezone
                      )
                    : moment(userSchedule.endTime || dayEnd)
                ).format('HH:mm');

                let hours = Math.ceil(
                    moment(endTime, 'HH:mm').diff(
                        moment(startTime, 'HH:mm'),
                        'minutes'
                    ) / 60
                );
                hours = hours < 0 ? hours + 24 : hours;

                let hoursToStart = Math.ceil(
                    moment(startTime, 'HH:mm').diff(
                        moment(now, 'HH:mm'),
                        'minutes'
                    ) / 60
                );
                hoursToStart =
                    hoursToStart < 0 ? hoursToStart + 24 : hoursToStart;

                const hoursToEnd = hours + hoursToStart;

                let nowToEnd = Math.ceil(
                    moment(endTime, 'HH:mm').diff(
                        moment(now, 'HH:mm'),
                        'minutes'
                    ) / 60
                );
                nowToEnd = nowToEnd < 0 ? nowToEnd + 24 : nowToEnd;

                const isUserActive =
                    (hoursToEnd !== nowToEnd || hoursToStart <= 0) &&
                    nowToEnd > 0;

                const timezone = (userSchedule && userSchedule.timezone
                    ? moment(userSchedule.startTime || dayStart).tz(
                          userSchedule.timezone
                      )
                    : moment(userSchedule.startTime || dayStart)
                ).zoneAbbr();

                const tempObj = { ...userSchedule };
                tempObj.startTime = startTime;
                tempObj.endTime = endTime;
                tempObj.timezone = timezone;

                if (isUserActive) {
                    activeSchedules.push(tempObj);
                } else {
                    hoursToStart =
                        hoursToStart <= 0 ? hoursToStart + 24 : hoursToStart;
                    if (hoursToStart < 24) {
                        upcomingSchedules.push(tempObj);
                    } else {
                        inactiveSchedules.push(tempObj);
                    }
                }
            });
        }

        let incidentslist;
        if (this.props.incidents) {
            incidentslist = this.props.incidents.map((incident, i) => {
                return (
                    <RenderIfUserInSubProject
                        key={`${incident._id || i}`}
                        subProjectId={
                            incident.projectId._id || incident.projectId
                        }
                    >
                        <IncidentStatus
                            count={i}
                            incident={incident}
                            multiple={true}
                        />
                    </RenderIfUserInSubProject>
                );
            });
        }

        return (
            <Dashboard>
                <Fade>
                    <BreadCrumbItem route={pathname} name="Home" />
                    <AlertDisabledWarning page="Home" />
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
                                                            !this.props
                                                                .escalation
                                                                .requesting
                                                        }
                                                    >
                                                        {userSchedules ? (
                                                            <>
                                                                <ShouldRender
                                                                    if={
                                                                        activeSchedules &&
                                                                        activeSchedules.length >
                                                                            0
                                                                    }
                                                                >
                                                                    <OnCallSchedule
                                                                        status="active"
                                                                        schedules={
                                                                            activeSchedules
                                                                        }
                                                                        currentProjectId={
                                                                            this
                                                                                .props
                                                                                .currentProjectId
                                                                        }
                                                                    />
                                                                </ShouldRender>

                                                                <ShouldRender
                                                                    if={
                                                                        upcomingSchedules &&
                                                                        upcomingSchedules.length >
                                                                            0
                                                                    }
                                                                >
                                                                    <OnCallSchedule
                                                                        status="upcoming"
                                                                        schedules={
                                                                            upcomingSchedules
                                                                        }
                                                                        currentProjectId={
                                                                            this
                                                                                .props
                                                                                .currentProjectId
                                                                        }
                                                                    />
                                                                </ShouldRender>

                                                                <ShouldRender
                                                                    if={
                                                                        inactiveSchedules &&
                                                                        inactiveSchedules.length >
                                                                            0
                                                                    }
                                                                >
                                                                    <OnCallSchedule
                                                                        status="inactive"
                                                                        schedules={
                                                                            inactiveSchedules
                                                                        }
                                                                        currentProjectId={
                                                                            this
                                                                                .props
                                                                                .currentProjectId
                                                                        }
                                                                    />
                                                                </ShouldRender>

                                                                <div className="Box-root Margin-bottom--12">
                                                                    {incidentslist &&
                                                                    incidentslist.length >
                                                                        0 ? (
                                                                        incidentslist
                                                                    ) : (
                                                                        <div className="Box-root Margin-bottom--12 Card-shadow--medium Box-background--green Border-radius--4">
                                                                            <div className="db-Trends-header Padding-vertical--48">
                                                                                <div className="db-Trends-controls">
                                                                                    <div className="ContentHeader-center Box-root Flex-flex Flex-direction--column Flex-justifyContent--center">
                                                                                        <div className="Box-root Flex-flex Flex-direction--row Flex-justifyContent--spaceBetween">
                                                                                            <div className="ContentHeader-center Box-root Flex-flex Flex-direction--column Flex-justifyContent--center">
                                                                                                <span className="Box-root Flex-flex Flex-direction--row Flex-justifyContent--center">
                                                                                                    <span
                                                                                                        id="component-content-header"
                                                                                                        className="ContentHeader-title Text-color--white Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-typeface--base Text-wrap--wrap"
                                                                                                    >
                                                                                                        You
                                                                                                        currently
                                                                                                        don&apos;t
                                                                                                        have
                                                                                                        any
                                                                                                        active
                                                                                                        incidents.
                                                                                                    </span>
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            ''
                                                        )}
                                                    </ShouldRender>

                                                    <ShouldRender
                                                        if={
                                                            this.props
                                                                .escalation
                                                                .requesting
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
            </Dashboard>
        );
    }
}

Home.displayName = 'Home';

Home.propTypes = {
    currentProjectId: PropTypes.string.isRequired,
    user: PropTypes.object.isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string,
    }),
    loadPage: PropTypes.func,
    userScheduleRequest: PropTypes.func,
    fetchUserSchedule: PropTypes.func,
    escalation: PropTypes.object,
    escalations: PropTypes.array,
    incidents: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.oneOf([null, undefined]),
    ]),
};

const mapStateToProps = (state, props) => {
    const { projectId } = props.match.params;

    return {
        currentProjectId: projectId,
        user: state.profileSettings.profileSetting.data,
        escalation: state.schedule.escalation,
        escalations: state.schedule.escalations,
        incidents: state.incident.unresolvedincidents.incidents,
    };
};

const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            loadPage,
            userScheduleRequest,
            fetchUserSchedule,
        },
        dispatch
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);