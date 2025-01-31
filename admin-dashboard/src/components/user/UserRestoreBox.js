import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormLoader } from '../basic/Loader';
import ShouldRender from '../basic/ShouldRender';
import { restoreUser } from '../../actions/user';
import { openModal, closeModal } from '../../actions/modal';

export class UserRestoreBox extends Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    handleClick = () => {
        const { restoreUser, userId } = this.props;
        return restoreUser(userId);
    };

    render() {
        const { isRequesting } = this.props;

        return (
            <div className="Box-root Margin-bottom--12">
                <div className="bs-ContentSection Card-root Card-shadow--medium">
                    <div className="Box-root">
                        <div className="bs-ContentSection-content Box-root Box-divider--surface-bottom-1 Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                            <div className="Box-root">
                                <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                    <span>Restore This User</span>
                                </span>
                                <p>
                                    <span>
                                        Click the button to restore this user.
                                    </span>
                                </p>
                            </div>
                            <div className="bs-ContentSection-footer bs-ContentSection-content Box-root Box-background--white Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--0 Padding-vertical--12">
                                <span className="db-SettingsForm-footerMessage"></span>
                                <div>
                                    <button
                                        id="restore"
                                        className="bs-Button bs-Button--blue Box-background--blue"
                                        disabled={isRequesting}
                                        onClick={this.handleClick}
                                    >
                                        <ShouldRender if={!isRequesting}>
                                            <span>Restore User</span>
                                        </ShouldRender>
                                        <ShouldRender if={isRequesting}>
                                            <FormLoader />
                                        </ShouldRender>
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

UserRestoreBox.displayName = 'UserRestoreBox';

const mapDispatchToProps = dispatch =>
    bindActionCreators({ restoreUser, openModal, closeModal }, dispatch);

const mapStateToProps = state => {
    const user = state.user.user.user || {};
    const userId = user._id;

    return {
        userId,
        user,
        isRequesting:
            state.user &&
            state.user.restoreUser &&
            state.user.restoreUser.requesting,
    };
};

UserRestoreBox.propTypes = {
    isRequesting: PropTypes.oneOf([null, undefined, true, false]),
    userId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    restoreUser: PropTypes.func.isRequired,
};

UserRestoreBox.contextTypes = {
    mixpanel: PropTypes.object.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(UserRestoreBox);
