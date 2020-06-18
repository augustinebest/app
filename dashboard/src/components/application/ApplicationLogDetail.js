import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history } from '../../store';
import ShouldRender from '../basic/ShouldRender';
import { openModal, closeModal } from '../../actions/modal';
import uuid from 'uuid';
import { SHOULD_LOG_ANALYTICS } from '../../config';
import { logEvent } from 'amplitude-js';
import { bindActionCreators } from 'redux';
import { deleteApplicationLog } from '../../actions/applicationLog';
import {
    fetchLogs,
    resetApplicationLogKey,
    editApplicationLogSwitch,
} from '../../actions/applicationLog';
import { setStartDate, setEndDate } from '../../actions/dateTime';
import ApplicationLogDetailView from './ApplicationLogDetailView';
import * as moment from 'moment';
import ApplicationLogHeader from './ApplicationLogHeader';
import NewApplicationLog from './NewApplicationLog';

class ApplicationLogDetail extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.state = {
            deleting: false,
            deleteModalId: uuid.v4(),
            openApplicationLogKeyModalId: uuid.v4(),
            logType: { value: '', label: 'All Logs' },
            startDate: props.startDate,
            endDate: props.endDate,
            filters: [],
            filter: {},
        };
    }
    handleDateTimeChange = value => {
        let startDate = value.startDate;
        let endDate = value.endDate;
        if (startDate && endDate) {
            startDate = moment(startDate);
            endDate = moment(endDate);
            this.setState(() => ({
                startDate,
                endDate,
            }));
            this.props.setStartDate(startDate);
            this.props.setEndDate(endDate);
        }
    };
    deleteApplicationLog = () => {
        const promise = this.props.deleteApplicationLog(
            this.props.currentProject._id,
            this.props.componentId,
            this.props.index
        );
        history.push(
            `/dashboard/project/${this.props.currentProject._id}/${this.props.componentId}/application-log`
        );
        if (SHOULD_LOG_ANALYTICS) {
            logEvent(
                'EVENT: DASHBOARD > PROJECT > COMPONENT > APPLICATION LOG > APPLICATION LOG DELETED',
                {
                    ProjectId: this.props.currentProject._id,
                    applicationLogId: this.props.index,
                }
            );
        }
        return promise;
    };
    resetApplicationLogKey = () => {
        return this.props
            .resetApplicationLogKey(
                this.props.currentProject._id,
                this.props.componentId,
                this.props.index
            )
            .then(() => {
                this.props.closeModal({
                    id: this.state.openApplicationLogKeyModalId,
                });
                if (SHOULD_LOG_ANALYTICS) {
                    logEvent(
                        'EVENT: DASHBOARD > COMPONENTS > APPLICATION LOG > APPLICATION LOG DETAILS > RESET APPLICATION LOG KEY',
                        {
                            applicationLogId: this.props.index,
                        }
                    );
                }
            });
    };
    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.props.closeModal({ id: this.state.deleteModalId });
            default:
                return false;
        }
    };
    handleLogTypeChange = logType => {
        this.setState(() => ({
            logType: logType,
        }));
    };
    handleLogFilterChange = filter => {
        if (!filter) return;
        let filters = this.state.filters;
        const exist = filters.filter(elem => elem.value === filter.value);
        if (exist.length < 1) {
            filters = [...this.state.filters, filter];
        }
        this.setState(() => ({
            filters,
            filter,
        }));
    };
    editApplicationLog = () => {
        const { applicationLog } = this.props;
        this.props.editApplicationLogSwitch(applicationLog._id);
        // This is crashing
        // if (SHOULD_LOG_ANALYTICS) {
        //     logEvent(
        //         'EVENT: DASHBOARD > PROJECT > COMPONENT > APPLICATION LOG > EDIT APPLICATION LOG CLICKED',
        //         {}
        //     );
        // }
    };
    viewMore = () => {
        const { currentProject, componentId, applicationLog } = this.props;
        history.push(
            '/dashboard/project/' +
                currentProject._id +
                '/' +
                componentId +
                '/application-logs/' +
                applicationLog._id
        );
    };
    render() {
        const {
            deleting,
            deleteModalId,
            openApplicationLogKeyModalId,
            startDate,
            endDate,
            logType,
            filters,
            filter,
        } = this.state;
        const {
            applicationLog,
            componentId,
            currentProject,
            fetchLogs,
        } = this.props;
        if (applicationLog) {
            fetchLogs(
                currentProject._id,
                componentId,
                applicationLog._id,
                0,
                10,
                startDate.clone().utc(),
                endDate.clone().utc(),
                logType.value,
                filter.value
            );
        }

        if (currentProject) {
            document.title = currentProject.name + ' Dashboard';
        }
        const logOptions = [
            { value: '', label: 'All Logs' },
            { value: 'warning', label: 'Warning' },
            { value: 'info', label: 'Info' },
            { value: 'error', label: 'Error' },
        ];
        if (applicationLog) {
            return (
                <div>
                    <div
                        className="Box-root Card-shadow--medium"
                        style={{ marginTop: '10px', marginBottom: '10px' }}
                        tabIndex="0"
                    >
                        <ShouldRender if={!applicationLog.editMode}>
                            <ApplicationLogHeader
                                applicationLog={applicationLog}
                                isDetails={this.props.isDetails}
                                openModal={this.props.openModal}
                                openApplicationLogKeyModalId={
                                    openApplicationLogKeyModalId
                                }
                                editApplicationLog={this.editApplicationLog}
                                deleteModalId={deleteModalId}
                                deleteApplicationLog={this.deleteApplicationLog}
                                deleting={deleting}
                                viewMore={this.viewMore}
                            />
                        </ShouldRender>
                        <ShouldRender if={applicationLog.editMode}>
                            <NewApplicationLog
                                edit={applicationLog.editMode}
                                applicationLog={applicationLog}
                                index={applicationLog._id}
                            />
                        </ShouldRender>

                        <ShouldRender if={!this.props.isDetails}>
                            <ApplicationLogDetailView
                                startDate={this.state.startDate}
                                logValue={this.state.logType}
                                filter={this.state.filter}
                                filters={filters}
                                applicationLog={applicationLog}
                                logOptions={logOptions}
                                componentId={componentId}
                                handleDateTimeChange={this.handleDateTimeChange}
                                handleLogTypeChange={this.handleLogTypeChange}
                                handleLogFilterChange={
                                    this.handleLogFilterChange
                                }
                                handleNewDateTimeChange={
                                    this.handleNewDateTimeChange
                                }
                            />
                        </ShouldRender>
                    </div>
                    <ShouldRender if={this.props.isDetails}>
                        <div
                            className="Box-root Card-shadow--medium"
                            style={{
                                marginTop: '10px',
                                marginBottom: '10px',
                                paddingBottom: '10px',
                            }}
                            tabIndex="0"
                        >
                            <ApplicationLogDetailView
                                startDate={this.state.startDate}
                                logValue={this.state.logType}
                                filter={this.state.filter}
                                filters={filters}
                                applicationLog={applicationLog}
                                logOptions={logOptions}
                                componentId={componentId}
                                handleDateTimeChange={this.handleDateTimeChange}
                                handleLogTypeChange={this.handleLogTypeChange}
                                handleLogFilterChange={
                                    this.handleLogFilterChange
                                }
                            />
                        </div>
                    </ShouldRender>
                </div>
            );
        } else {
            return null;
        }
    }
}
ApplicationLogDetail.displayName = 'ApplicationLogDetail';

const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            openModal,
            closeModal,
            deleteApplicationLog,
            fetchLogs,
            resetApplicationLogKey,
            setStartDate,
            setEndDate,
            editApplicationLogSwitch,
        },
        dispatch
    );
};
function mapStateToProps(state, ownProps) {
    const applicationLogs =
        state.applicationLog.applicationLogsList.applicationLogs;
    const applicationLogFromRedux = applicationLogs.filter(
        applicationLog => applicationLog._id === ownProps.index
    );
    return {
        currentProject: state.project.currentProject,
        startDate: state.dateTime.dates.startDate,
        endDate: state.dateTime.dates.endDate,
        applicationLog: applicationLogFromRedux[0],
        editMode: applicationLogFromRedux[0].editMode,
    };
}

ApplicationLogDetail.propTypes = {
    componentId: PropTypes.string,
    index: PropTypes.string,
    applicationLog: PropTypes.object,
    currentProject: PropTypes.object,
    openModal: PropTypes.func,
    closeModal: PropTypes.func,
    resetApplicationLogKey: PropTypes.func,
    deleteApplicationLog: PropTypes.func,
    setStartDate: PropTypes.func,
    setEndDate: PropTypes.func,
    fetchLogs: PropTypes.func,
    isDetails: PropTypes.bool,
    startDate: PropTypes.instanceOf(moment),
    endDate: PropTypes.instanceOf(moment),
    editApplicationLogSwitch: PropTypes.func,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ApplicationLogDetail);
