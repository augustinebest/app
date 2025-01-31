import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getMonitorLogs } from '../../actions/monitor';
//import MonitorLogsList from '../monitor/MonitorLogsList';
import Select from '../../components/basic/react-select-fyipe';
//import ShouldRender from '../../components/basic/ShouldRender';
//import DateTimeRangePicker from '../basic/DateTimeRangePicker';
//import moment from 'moment';

//const endDate = moment();
//const startDate = moment().subtract(30, 'd');
export class PerformanceView extends Component {
    /*  constructor(props) {
        super(props);
        this.props = props;
        this.state = {
            probeValue: { value: '', label: 'All Probes' },
            startDate: startDate,
            endDate: endDate,
            page: 1,
        };
    }

    prevClicked = (monitorId, skip, limit) => {
        const { currentProject, getMonitorLogs } = this.props;
        const incidentId = this.props.incidentId ? this.props.incidentId : null;
        const start = incidentId ? '' : this.state.startDate.clone().utc();
        const end = incidentId ? '' : this.state.endDate.clone().utc();
        getMonitorLogs(
            currentProject._id,
            monitorId,
            skip ? parseInt(skip, 10) - 10 : 10,
            limit,
            start,
            end,
            this.state.probeValue.value,
            incidentId,
            this.props.monitorType
        );
        this.setState({ page: this.state.page - 1 });
        if (window.location.href.indexOf('localhost') <= -1) {
            this.context.mixpanel.track('Previous Incident Requested', {
                projectId: currentProject._id,
            });
        }
    };

    nextClicked = (monitorId, skip, limit) => {
        const { currentProject, getMonitorLogs } = this.props;
        const incidentId = this.props.incidentId ? this.props.incidentId : null;
        const start = incidentId ? '' : this.state.startDate.clone().utc();
        const end = incidentId ? '' : this.state.endDate.clone().utc();
        getMonitorLogs(
            currentProject._id,
            monitorId,
            skip ? parseInt(skip, 10) + 10 : 10,
            limit,
            start,
            end,
            this.state.probeValue.value,
            incidentId,
            this.props.monitorType
        );
        this.setState({ page: this.state.page + 1 });
        if (window.location.href.indexOf('localhost') <= -1) {
            this.context.mixpanel.track('Next Incident Requested', {
                projectId: currentProject._id,
            });
        }
    };
    handleStartDateTimeChange = val => {
        const startDate = moment(val);
        this.handleDateChange(startDate, this.state.endDate);
    };
    handleEndDateTimeChange = val => {
        const endDate = moment(val);
        this.handleDateChange(this.state.startDate, endDate);
    };

    handleDateChange = (startDate, endDate) => {
        const { currentProject, getMonitorLogs, monitorId } = this.props;
        this.setState({
            startDate,
            endDate,
        });
        getMonitorLogs(
            currentProject._id,
            monitorId,
            0,
            10,
            startDate.clone().utc(),
            endDate.clone().utc(),
            this.state.probeValue.value,
            null,
            this.props.monitorType
        );
    };

    handleTimeChange = (startDate, endDate) => {
        const { currentProject, getMonitorLogs, monitorId } = this.props;
        getMonitorLogs(
            currentProject._id,
            monitorId,
            0,
            10,
            startDate.clone().utc(),
            endDate.clone().utc(),
            this.state.probeValue.value,
            null,
            this.props.monitorType
        );
    };

    handleProbeChange = data => {
        this.setState({ probeValue: data });
        const { currentProject, getMonitorLogs, monitorId } = this.props;
        getMonitorLogs(
            currentProject._id,
            monitorId,
            0,
            10,
            this.state.startDate.clone().utc(),
            this.state.endDate.clone().utc(),
            data.value,
            null,
            this.props.monitorType
        );
    };*/

    render() {
        /* const probeOptions =
            this.props.probes && this.props.probes.length > 0
                ? this.props.probes.map(p => {
                      return { value: p._id, label: p.probeName };
                  })
                : [];
        probeOptions.unshift({ value: '', label: 'All Probes' });*/
        return (
            <div
                className="Box-root Card-shadow--medium"
                tabIndex="0"
                onKeyDown={this.handleKeyBoard}
            >
                <div className="db-Trends-header Box-background--white Box-divider--surface-bottom-1">
                    <div
                        className="db-Trends-controls"
                        style={{ justifyContent: 'space-evenly' }}
                    >
                        <div
                            className="bs-Fieldset-row"
                            style={{ padding: '1px' }}
                        >
                            <label
                                className="bs-Fieldset-label"
                                style={{ flex: '1' }}
                            >
                                Transaction Type
                            </label>
                            <div className="bs-Fieldset-fields">
                                <Select
                                    name="transaction_type"
                                    value={{ value: '', label: 'All' }}
                                    placeholder="Web"
                                    className="db-select-in"
                                    id="transaction_type"
                                    isDisabled={false}
                                    style={{ height: '28px' }}
                                    options={[
                                        {
                                            value: 'a',
                                            label: 'hello',
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                        <div
                            className="bs-Fieldset-row"
                            style={{ padding: '1px' }}
                        >
                            <label
                                className="bs-Fieldset-label"
                                style={{ flex: '1' }}
                            >
                                Compare With
                            </label>
                            <div className="bs-Fieldset-fields">
                                <Select
                                    name="compare_with"
                                    value={{ value: '', label: 'All' }}
                                    placeholder="All"
                                    className="db-select-in"
                                    id="compare_with"
                                    isDisabled={false}
                                    style={{ height: '28px' }}
                                    options={[
                                        {
                                            value: 'a',
                                            label: 'hello',
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                        <div
                            className="bs-Fieldset-row"
                            style={{ padding: '1px' }}
                        >
                            <label
                                className="bs-Fieldset-label"
                                style={{ flex: '1' }}
                            >
                                Instances
                            </label>
                            <div className="bs-Fieldset-fields">
                                <Select
                                    name="instances"
                                    value={{ value: '', label: 'All' }}
                                    placeholder="All"
                                    className="db-select-in"
                                    id="instances"
                                    isDisabled={false}
                                    style={{ height: '28px' }}
                                    options={[
                                        {
                                            value: 'a',
                                            label: 'hello',
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

PerformanceView.displayName = 'PerformanceView';

PerformanceView.propTypes = {};

const mapDispatchToProps = dispatch =>
    bindActionCreators({ getMonitorLogs }, dispatch);

function mapStateToProps(state, props) {
    const monitorId = props.monitorId ? props.monitorId : null;
    return {
        monitorLogs: monitorId ? state.monitor.monitorLogs[monitorId] : {},
        probes: state.probe.probes.data,
        currentProject: state.project.currentProject,
    };
}

PerformanceView.contextTypes = {
    mixpanel: PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(PerformanceView);
