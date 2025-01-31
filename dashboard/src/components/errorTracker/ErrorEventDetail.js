import React, { Component } from 'react';
import ErrorEventHeader from './ErrorEventHeader';
import ErrorEventMiniTag from './ErrorEventMiniTag';
import ErrorEventStackTrace from './ErrorEventStackTrace';
import ErrorEventTimeline from './ErrorEventTimeline';
import ErrorEventInfoSection from './ErrorEventInfoSection';
import PropTypes from 'prop-types';
import {
    ignoreErrorEvent,
    unresolveErrorEvent,
    resolveErrorEvent,
    deleteErrorTrackerIssue,
} from '../../actions/errorTracker';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Notification from '../basic/Notification';
import ShouldRender from '../basic/ShouldRender';
import ErrorTrackerIssueTimeline from './ErrorTrackerIssueTimeline';
import { v4 as uuidv4 } from 'uuid';
import DataPathHoC from '../DataPathHoC';
import { openModal } from '../../actions/modal';
import DeleteErrorTrackerIssue from '../modals/DeleteErrorTrackerIssue';
import { history } from '../../store';

class ErrorEventDetail extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.state = {
            deleteModalId: uuidv4(),
        };
    }
    ignoreErrorEvent = (issueId, unIgnore = false) => {
        const {
            projectId,
            componentId,
            errorTrackerId,
            ignoreErrorEvent,
        } = this.props;
        ignoreErrorEvent(
            projectId,
            componentId,
            errorTrackerId,
            [issueId],
            unIgnore
        );
    };
    unresolveErrorEvent = issueId => {
        const {
            projectId,
            componentId,
            errorTrackerId,
            unresolveErrorEvent,
        } = this.props;
        unresolveErrorEvent(projectId, componentId, errorTrackerId, [issueId]);
    };
    resolveErrorEvent = issueId => {
        const {
            projectId,
            componentId,
            errorTrackerId,
            resolveErrorEvent,
        } = this.props;
        resolveErrorEvent(projectId, componentId, errorTrackerId, [issueId]);
    };
    openDeleteModal = issue => {
        this.props.openModal({
            id: this.state.deleteModalId,
            onClose: () => '',
            onConfirm: () => this.deleteErrorTrackerIssue(issue),
            content: DataPathHoC(DeleteErrorTrackerIssue, { issue }),
        });
    };
    deleteErrorTrackerIssue = issue => {
        const {
            projectId,
            componentId,
            errorTrackerId,
            errorTrackerSlug,
            deleteErrorTrackerIssue,
            currentProject,
            componentSlug,
        } = this.props;
        const promise = deleteErrorTrackerIssue(
            projectId,
            componentId,
            errorTrackerId,
            issue._id
        );
        history.push(
            `/dashboard/project/${currentProject.slug}/component/${componentSlug}/error-trackers/${errorTrackerSlug}`
        );

        return promise;
    };
    render() {
        const {
            errorEvent,
            navigationLink,
            errorTrackerIssue,
            errorTrackerStatus,
            errorTrackerState,
        } = this.props;
        return (
            <div className="bs-BIM">
                <ShouldRender if={errorTrackerIssue.ignored}>
                    <Notification
                        backgroundClass="Box-background--red4"
                        icon="db-SideNav-icon--warning"
                        message={
                            <span>This issue has been marked as ignored.</span>
                        }
                    />
                </ShouldRender>
                <ShouldRender if={errorTrackerIssue.resolved}>
                    <Notification
                        backgroundClass="Box-background--green"
                        message={
                            <span>This issue has been marked as resolved.</span>
                        }
                    />
                </ShouldRender>
                <div className="Box-root Margin-bottom--12">
                    <div className="bs-ContentSection Card-root Card-shadow--medium">
                        <div className="Box-root">
                            <div>
                                <div className="Padding-all--20">
                                    <ErrorEventHeader
                                        errorEvent={errorEvent}
                                        errorTrackerIssue={errorTrackerIssue}
                                        navigationLink={navigationLink}
                                        ignoreErrorEvent={this.ignoreErrorEvent}
                                        unresolveErrorEvent={
                                            this.unresolveErrorEvent
                                        }
                                        resolveErrorEvent={
                                            this.resolveErrorEvent
                                        }
                                        errorTrackerStatus={errorTrackerStatus}
                                        openDeleteModal={this.openDeleteModal}
                                        errorTrackerState={errorTrackerState}
                                    />
                                    <ErrorEventMiniTag
                                        errorEvent={errorEvent}
                                    />
                                    <ErrorEventStackTrace
                                        errorEvent={errorEvent}
                                    />

                                    <ErrorEventInfoSection
                                        errorEvent={errorEvent}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ErrorEventTimeline errorEvent={errorEvent} />
                <ErrorTrackerIssueTimeline
                    errorEvent={errorEvent}
                    errorTrackerIssue={errorTrackerIssue}
                />
            </div>
        );
    }
}
const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            ignoreErrorEvent,
            unresolveErrorEvent,
            resolveErrorEvent,
            openModal,
            deleteErrorTrackerIssue,
        },
        dispatch
    );
};
const mapStateToProps = (state, ownProps) => {
    const errorTrackerId = ownProps.errorTrackerId;
    const errorTrackers = state.errorTracker.errorTrackersList.errorTrackers;
    const currentErrorTracker = errorTrackers.filter(
        errorTracker => errorTracker._id === errorTrackerId
    );
    const errorTrackerIssues = state.errorTracker.errorTrackerIssues[
        errorTrackerId
    ]
        ? state.errorTracker.errorTrackerIssues[errorTrackerId]
              .errorTrackerIssues
        : [];
    const errorEvent = ownProps.errorEvent.errorEvent;
    // check if issue id exist in the redux state first, before using the issue details in the error event
    let errorEventIssue;
    if (errorEvent) {
        errorEventIssue = errorTrackerIssues.filter(
            errorTrackerIssue =>
                errorTrackerIssue._id === errorEvent.issueId._id
        )[0];
    }
    const errorTrackerIssueStatus = errorEventIssue
        ? errorEventIssue
        : errorEvent
        ? errorEvent.issueId
        : {};

    const errorTrackerStatus =
        state.errorTracker.errorTrackerStatus[ownProps.errorTrackerId];

    return {
        errorTracker: currentErrorTracker[0],
        currentProject: state.project.currentProject,
        errorTrackerIssue: errorTrackerIssueStatus,
        ignored: errorTrackerIssueStatus.ignored,
        resolved: errorTrackerIssueStatus.resolved,
        timeline: errorTrackerIssueStatus.timeline,
        errorTrackerStatus,
        errorTrackerState: state.errorTracker,
    };
};
ErrorEventDetail.propTypes = {
    errorEvent: PropTypes.object,
    navigationLink: PropTypes.func,
    ignoreErrorEvent: PropTypes.func,
    projectId: PropTypes.string,
    componentId: PropTypes.string,
    componentSlug: PropTypes.string,
    errorTrackerId: PropTypes.string,
    errorTrackerSlug: PropTypes.string,
    errorTrackerIssue: PropTypes.object,
    unresolveErrorEvent: PropTypes.func,
    resolveErrorEvent: PropTypes.func,
    errorTrackerStatus: PropTypes.object,
    openModal: PropTypes.func,
    errorTrackerState: PropTypes.object,
    deleteErrorTrackerIssue: PropTypes.func,
    currentProject: PropTypes.object,
};
ErrorEventDetail.displayName = 'ErrorEventDetail';
export default connect(mapStateToProps, mapDispatchToProps)(ErrorEventDetail);
