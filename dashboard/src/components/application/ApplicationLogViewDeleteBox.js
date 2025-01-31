import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import PropTypes from 'prop-types';
import { openModal, closeModal } from '../../actions/modal';
import { deleteApplicationLog } from '../../actions/applicationLog';
import { history } from '../../store';
import DataPathHoC from '../DataPathHoC';
import { logEvent } from '../../analytics';
import { SHOULD_LOG_ANALYTICS } from '../../config';
import DeleteApplicationLog from '../modals/DeleteApplicationLog';

class ApplicationLogViewDeleteBox extends Component {
    constructor(props) {
        super(props);
        this.state = { deleteModalId: uuidv4() };
    }
    deleteApplicationLog = () => {
        const applicationLog = this.props.applicationLog;
        const componentId = applicationLog.componentId._id;
        const currentProjectId = this.props.currentProject._id;
        const promise = this.props.deleteApplicationLog(
            currentProjectId,
            componentId,
            this.props.applicationLog._id
        );
        history.push(
            `/dashboard/project/${this.props.currentProject.slug}/component/${this.props.componentSlug}/application-log`
        );
        if (SHOULD_LOG_ANALYTICS) {
            logEvent(
                'EVENT: DASHBOARD > PROJECT > COMPONENT > LOG CONTAINER > LOG CONTAINER DELETED',
                {
                    ProjectId: this.props.currentProject._id,
                    applicationLogId: this.props.applicationLog._id,
                }
            );
        }
        return promise;
    };

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.props.closeModal({ id: this.state.deleteModalId });
            default:
                return false;
        }
    };
    render() {
        const { deleteModalId } = this.state;
        return (
            <div
                onKeyDown={this.handleKeyBoard}
                className="Box-root Margin-bottom--12"
            >
                <div className="bs-ContentSection Card-root Card-shadow--medium">
                    <div className="Box-root">
                        <div className="bs-ContentSection-content Box-root Box-divider--surface-bottom-1 Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                            <div className="Box-root">
                                <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                    <span>Delete Log Container</span>
                                </span>
                                <p>
                                    <span>
                                        Click the button to permanantly delete
                                        this log container.
                                    </span>
                                </p>
                            </div>
                            <div className="bs-ContentSection-footer bs-ContentSection-content Box-root Box-background--white Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--0 Padding-vertical--12">
                                <span className="db-SettingsForm-footerMessage"></span>
                                <div>
                                    <button
                                        className="bs-Button bs-Button--red Box-background--red"
                                        onClick={() =>
                                            this.props.openModal({
                                                id: deleteModalId,
                                                onClose: () => '',
                                                onConfirm: () =>
                                                    this.deleteApplicationLog(),
                                                content: DataPathHoC(
                                                    DeleteApplicationLog,
                                                    {
                                                        applicationLog: this
                                                            .props
                                                            .applicationLog,
                                                    }
                                                ),
                                            })
                                        }
                                    >
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
ApplicationLogViewDeleteBox.displayName = 'ApplicationLogViewDeleteBox';

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        { openModal, closeModal, deleteApplicationLog },
        dispatch
    );

const mapStateToProps = state => {
    return {
        applicationLogState: state.applicationLog,
        currentProject: state.project.currentProject,
    };
};

ApplicationLogViewDeleteBox.propTypes = {
    currentProject: PropTypes.object,
    componentId: PropTypes.string.isRequired,
    componentSlug: PropTypes.string.isRequired,
    closeModal: PropTypes.func,
    openModal: PropTypes.func.isRequired,
    applicationLog: PropTypes.object,
    deleteApplicationLog: PropTypes.func.isRequired,
};

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(ApplicationLogViewDeleteBox)
);
