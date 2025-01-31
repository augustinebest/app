import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
    fetchIncidentMessages,
    deleteIncidentMessage,
} from '../../actions/incident';
import { SHOULD_LOG_ANALYTICS } from '../../config';
import { logEvent } from '../../analytics';
import IncidentMessageThread from './IncidentMessageThread';
import { openModal } from '../../actions/modal';
import { v4 as uuidv4 } from 'uuid';

export class IncidentInvestigation extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.state = {
            createMessageModalId: uuidv4(),
            editMessageModalId: uuidv4(),
            deleteMessageModalId: uuidv4(),
            page: 1,
        };
    }
    olderInvestigationMessage = () => {
        this.props.fetchIncidentMessages(
            this.props.currentProject._id,
            this.props.incident.slug,
            parseInt(this.props.incidentMessages.skip, 10) -
                parseInt(this.props.incidentMessages.limit, 10),
            parseInt(this.props.incidentMessages.limit, 10)
        );
        this.setState({
            page: this.state.page - 1,
        });
        if (SHOULD_LOG_ANALYTICS) {
            logEvent(
                'EVENT: DASHBOARD > PROJECT > INCIDENT > OLDER INVESTIGATION MESSAGES CLICKED',
                {
                    projectId: this.props.currentProject._id,
                    incidentId: this.props.incident._id,
                }
            );
        }
    };

    newerInvestigationMessage = () => {
        this.props.fetchIncidentMessages(
            this.props.currentProject._id,
            this.props.incident.slug,
            parseInt(this.props.incidentMessages.skip, 10) +
                parseInt(this.props.incidentMessages.limit, 10),
            parseInt(this.props.incidentMessages.limit, 10)
        );
        this.setState({
            page: this.state.page + 1,
        });
        if (SHOULD_LOG_ANALYTICS) {
            logEvent(
                'EVENT: DASHBOARD > PROJECT > INCIDENT > NEWER INVESTIGATION MESSAGES CLICKED',
                {
                    projectId: this.props.currentProject._id,
                    incidentId: this.props.incident._id,
                }
            );
        }
    };
    deleteInvestigationMessage = incidentMessageId => {
        const promise = this.props.deleteIncidentMessage(
            this.props.currentProject._id,
            this.props.incident._id,
            incidentMessageId
        );
        if (SHOULD_LOG_ANALYTICS) {
            logEvent(
                'EVENT: DASHBOARD > PROJECT > INCIDENT > INVESTIGATION MESSAGE DELETED',
                {
                    ProjectId: this.props.currentProject._id,
                    incidentMessageId: incidentMessageId,
                }
            );
        }
        return promise;
    };
    render() {
        let count = 0;
        let skip = 0;
        let limit = 0;
        let requesting = false;
        let canPrev = false;
        let canNext = false;
        let error;
        const { incidentMessages, incident, openModal } = this.props;
        const {
            createMessageModalId,
            editMessageModalId,
            deleteMessageModalId,
        } = this.state;
        const numberOfPages = Math.ceil(
            parseInt(incidentMessages && incidentMessages.count) / 10
        );
        if (incidentMessages) {
            count = incidentMessages.count;
            skip = incidentMessages.skip;
            limit = incidentMessages.limit;
            requesting = incidentMessages.requesting;
            error = incidentMessages.error;

            if (count && typeof count === 'string') {
                count = parseInt(count, 10);
            }
            if (skip && typeof skip === 'string') {
                skip = parseInt(skip, 10);
            }
            if (limit && typeof limit === 'string') {
                limit = parseInt(limit, 10);
            }
            if (!skip) skip = 0;
            if (!limit) limit = 10;
            canNext = count > skip + limit ? true : false;
            canPrev = skip <= 0 ? false : true;

            if (requesting || count < 1) {
                canNext = false;
                canPrev = false;
            }
        }

        return (
            <div className="Box-root Margin-bottom--12">
                <div className="bs-ContentSection Card-root Card-shadow--medium">
                    <IncidentMessageThread
                        title="Status Page"
                        description="Tell your customer what went wrong. This will be visible to your customers."
                        incidentMessages={incidentMessages}
                        count={incidentMessages && incidentMessages.count}
                        canPrev={canPrev}
                        canNext={canNext}
                        requesting={requesting}
                        incident={incident}
                        type={'investigation'}
                        error={error}
                        newerMessage={this.newerInvestigationMessage}
                        olderMessage={this.olderInvestigationMessage}
                        createMessageModalId={createMessageModalId}
                        openModal={openModal}
                        editMessageModalId={editMessageModalId}
                        deleteMessageModalId={deleteMessageModalId}
                        deleteIncidentMessage={this.deleteInvestigationMessage}
                        numberOfPages={numberOfPages}
                        page={this.state.page}
                        slug={this.props.currentProject.slug}
                    />
                </div>
            </div>
        );
    }
}

IncidentInvestigation.displayName = 'IncidentInvestigation';

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            fetchIncidentMessages,
            openModal,
            deleteIncidentMessage,
        },
        dispatch
    );

function mapStateToProps(state, ownProps) {
    const incidentMessages = state.incident.incidentMessages
        ? state.incident.incidentMessages[ownProps.incident.slug]
            ? state.incident.incidentMessages[ownProps.incident.slug][
                  'investigation'
              ]
            : {}
        : {};
    const currentProject = state.project.currentProject;
    return {
        incidentMessages,
        currentProject,
    };
}

IncidentInvestigation.propTypes = {
    incident: PropTypes.object.isRequired,
    incidentMessages: PropTypes.object,
    currentProject: PropTypes.object,
    fetchIncidentMessages: PropTypes.func,
    openModal: PropTypes.func,
    deleteIncidentMessage: PropTypes.func,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(IncidentInvestigation);
