import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ClickOutside from 'react-click-outside';
import { closeModal, openModal } from '../../actions/modal';
import ShouldRender from '../basic/ShouldRender';
import KubeIndicator from '../monitor/KubeIndicator';
import DataPathHoC from '../DataPathHoC';
import KubeDeploymentData from './KubeDeploymentData';

class KubeDeployment extends React.Component {
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyBoard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Enter':
            case 'Escape':
                return this.handleCloseModal();
            default:
                return false;
        }
    };

    handleCloseModal = () => {
        /**
         * NORMAL BEHAVIOR:
         * 1. when a user clicks within the modal, the modal should not close
         * 2. when a user clicks outside the modal, the last modal on the stack should close (the currently viewed modal)
         *
         * BUG FIX:
         * a tiny hack to fix issue with closing stacked modals
         * when a user clicks on the modal
         */
        if (this.props.modals.length === 1) {
            this.props.closeModal();
        }
    };

    handleDeploymentData = data => {
        this.props.openModal({
            content: DataPathHoC(KubeDeploymentData, { data }),
        });
    };

    render() {
        const { data } = this.props;
        const deploymentData = data.data;
        const logTitle = data.title;

        return (
            <div
                className="ModalLayer-contents"
                tabIndex="-1"
                style={{ marginTop: '40px' }}
            >
                <div className="bs-BIM">
                    <div
                        className="bs-Modal"
                        style={{ width: '100%', maxWidth: 600 }}
                    >
                        <ClickOutside onClickOutside={this.handleCloseModal}>
                            <div className="bs-Modal-header">
                                <div
                                    className="bs-Modal-header-copy"
                                    style={{
                                        marginBottom: '10px',
                                        marginTop: '10px',
                                    }}
                                >
                                    <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                        <span>{logTitle}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="bs-Modal-content">
                                <div className="bs-ObjectList db-UserList">
                                    <div
                                        style={{
                                            overflow: 'hidden',
                                            overflowX: 'auto',
                                        }}
                                    >
                                        <div
                                            id="scheduledEventsList"
                                            className="bs-ObjectList-rows"
                                        >
                                            <ShouldRender
                                                if={
                                                    deploymentData &&
                                                    deploymentData.length > 0
                                                }
                                            >
                                                <header
                                                    className="bs-ObjectList-row bs-ObjectList-row--header"
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'space-between',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <div className="bs-ObjectList-cell">
                                                        Deployment Name
                                                    </div>
                                                    <div
                                                        className="bs-ObjectList-cell"
                                                        style={{
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        Ready
                                                    </div>
                                                </header>
                                            </ShouldRender>
                                            {deploymentData &&
                                                deploymentData.map(
                                                    (data, index) => (
                                                        <div
                                                            key={data._id}
                                                            className="scheduled-event-list-item bs-ObjectList-row db-UserListRow"
                                                            style={{
                                                                backgroundColor:
                                                                    'white',
                                                                height: 60,
                                                                borderBottom:
                                                                    '1px solid #cfd7df80',
                                                                display: 'flex',
                                                                justifyContent:
                                                                    'space-between',
                                                                alignItems:
                                                                    'center',
                                                                cursor:
                                                                    'pointer',
                                                            }}
                                                            id={`deploymentData_${index}`}
                                                            onClick={() =>
                                                                this.handleDeploymentData(
                                                                    data
                                                                )
                                                            }
                                                        >
                                                            <div className="bs-ObjectList-cell bs-u-v-middle">
                                                                <div className="bs-ObjectList-cell-row">
                                                                    <KubeIndicator
                                                                        status={
                                                                            data.readyDeployment ===
                                                                            data.desiredDeployment
                                                                                ? 'healthy'
                                                                                : 'unhealthy'
                                                                        }
                                                                        index={
                                                                            index
                                                                        }
                                                                    />
                                                                    {
                                                                        data.deploymentName
                                                                    }
                                                                </div>
                                                            </div>
                                                            <div className="bs-ObjectList-cell bs-u-v-middle">
                                                                <div
                                                                    className="bs-ObjectList-cell-row"
                                                                    style={{
                                                                        textAlign:
                                                                            'right',
                                                                        whiteSpace:
                                                                            'normal',
                                                                    }}
                                                                >
                                                                    {
                                                                        data.readyDeployment
                                                                    }
                                                                    /
                                                                    {
                                                                        data.desiredDeployment
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                        </div>
                                    </div>
                                    <ShouldRender
                                        if={
                                            !deploymentData ||
                                            deploymentData.length === 0
                                        }
                                    >
                                        <div
                                            className="Box-root Flex-flex Flex-alignItems--center Flex-justifyContent--center"
                                            style={{
                                                textAlign: 'center',
                                                backgroundColor: 'white',
                                                padding: '20px 10px',
                                            }}
                                            id="noprojectDomains"
                                        >
                                            <span>
                                                {!deploymentData ||
                                                deploymentData.length === 0
                                                    ? 'Sorry no Deployment data at this time'
                                                    : null}
                                            </span>
                                        </div>
                                    </ShouldRender>
                                </div>
                            </div>
                            <div className="bs-Modal-footer">
                                <div className="bs-Modal-footer-actions">
                                    <button
                                        id="okBtn"
                                        className="bs-Button bs-DeprecatedButton bs-Button--blue btn__modal"
                                        type="submit"
                                        onClick={this.handleCloseModal}
                                    >
                                        <>
                                            <span>Ok</span>
                                            <span className="create-btn__keycode">
                                                <span className="keycode__icon keycode__icon--enter" />
                                            </span>
                                        </>
                                    </button>
                                </div>
                            </div>
                        </ClickOutside>
                    </div>
                </div>
            </div>
        );
    }
}

KubeDeployment.displayName = 'KubeDeployment';

KubeDeployment.propTypes = {
    closeModal: PropTypes.func.isRequired,
    data: PropTypes.object,
    openModal: PropTypes.func,
    modals: PropTypes.array,
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            closeModal,
            openModal,
        },
        dispatch
    );

const mapStateToProps = state => ({
    modals: state.modal.modals,
});

export default connect(mapStateToProps, mapDispatchToProps)(KubeDeployment);
