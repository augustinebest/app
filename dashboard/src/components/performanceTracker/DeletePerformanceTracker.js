import React, { Component } from 'react';
import ShouldRender from '../basic/ShouldRender';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ClickOutside from 'react-click-outside';
import { closeModal } from '../../actions/modal';
import { FormLoader } from '../basic/Loader';
import PropTypes from 'prop-types';
import { deletePerformanceTracker } from '../../actions/performanceTracker';
import { history } from '../../store';

class DeletePerformanceTracker extends Component {
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyBoard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.props.closeModal();
            case 'Enter':
                return this.handleDelete();
            default:
                return false;
        }
    };

    handleDelete = () => {
        const {
            closeModal,
            data,
            deletePerformanceTracker,
            trackerObj,
        } = this.props;
        const { project, componentSlug, performanceTrackerId } = data;

        deletePerformanceTracker({
            projectId: project._id,
            performanceTrackerId,
        }).then(() => {
            if (!trackerObj.error) {
                closeModal();

                history.push(
                    `/dashboard/project/${project.slug}/component/${componentSlug}/performance-tracker`
                );
            }
        });
    };

    render() {
        const { closeModal, trackerObj } = this.props;

        return (
            <div className="ModalLayer-wash Box-root Flex-flex Flex-alignItems--flexStart Flex-justifyContent--center">
                <div
                    className="ModalLayer-contents"
                    tabIndex={-1}
                    style={{ marginTop: 40 }}
                >
                    <div className="bs-BIM">
                        <div className="bs-Modal bs-Modal--medium">
                            <ClickOutside onClickOutside={closeModal}>
                                <div className="bs-Modal-header">
                                    <div className="bs-Modal-header-copy">
                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                            <span>Confirm Deletion</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="bs-Modal-content">
                                    <span className="Text-color--inherit Text-display--inline Text-fontSize--14 Text-fontWeight--regular Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                        Are you sure you want to delete this
                                        performance tracker ?
                                    </span>
                                </div>
                                <div className="bs-Modal-footer">
                                    <div className="bs-Modal-footer-actions">
                                        <ShouldRender
                                            if={
                                                !trackerObj.requesting &&
                                                trackerObj.error
                                            }
                                        >
                                            <div
                                                id="deleteCardError"
                                                className="bs-Tail-copy"
                                            >
                                                <div
                                                    className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                                                    style={{
                                                        marginTop: '10px',
                                                    }}
                                                >
                                                    <div className="Box-root Margin-right--8">
                                                        <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                                    </div>
                                                    <div className="Box-root">
                                                        <span
                                                            style={{
                                                                color: 'red',
                                                            }}
                                                        >
                                                            {trackerObj.error}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </ShouldRender>
                                    </div>
                                    <div className="bs-Modal-footer-actions">
                                        <button
                                            className="bs-Button bs-DeprecatedButton bs-Button--grey btn__modal"
                                            type="button"
                                            onClick={closeModal}
                                            id="cancelApplicationSecurityModalBtn"
                                        >
                                            <span>Cancel</span>
                                            <span className="cancel-btn__keycode">
                                                Esc
                                            </span>
                                        </button>
                                        <button
                                            id="deleteApplicationSecurityModalBtn"
                                            className="bs-Button bs-DeprecatedButton bs-Button--red btn__modal"
                                            type="button"
                                            onClick={this.handleDelete}
                                            disabled={trackerObj.requesting}
                                            autoFocus={true}
                                        >
                                            {!trackerObj.requesting && (
                                                <>
                                                    <span>Delete</span>
                                                    <span className="delete-btn__keycode">
                                                        <span className="keycode__icon keycode__icon--enter" />
                                                    </span>
                                                </>
                                            )}
                                            {trackerObj.requesting && (
                                                <FormLoader />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </ClickOutside>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            closeModal,
            deletePerformanceTracker,
        },
        dispatch
    );

const mapStateToProps = state => {
    return {
        trackerObj: state.performanceTracker.deletePerformanceTracker,
        data: state.modal.modals[0],
    };
};

DeletePerformanceTracker.propTypes = {
    closeModal: PropTypes.func.isRequired,
    data: PropTypes.object,
    trackerObj: PropTypes.object,
    deletePerformanceTracker: PropTypes.func,
};

DeletePerformanceTracker.displayName = 'DeletePerformanceTracker';

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DeletePerformanceTracker);
