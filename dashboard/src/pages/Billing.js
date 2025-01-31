import React, { Component } from 'react';
import { connect } from 'react-redux';
import Fade from 'react-reveal/Fade';
import CustomerBalance from '../components/paymentCard/CustomerBalance';
import AlertCharges from '../components/alert/AlertCharges';
import ChangePlan from '../components/settings/ChangePlan';
import AlertAdvanceOption from '../components/settings/AlertAdvanceOption';
import { logEvent } from '../analytics';
import { SHOULD_LOG_ANALYTICS } from '../config';
import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import getParentRoute from '../utils/getParentRoute';
import { PropTypes } from 'prop-types';
import AlertDisabledWarning from '../components/settings/AlertDisabledWarning';
import ShouldRender from '../components/basic/ShouldRender';
import { getSmtpConfig } from '../actions/smsTemplates';
import { bindActionCreators } from 'redux';
import DeleteProject from '../components/settings/DeleteProject';
import RenderIfOwner from '../components/basic/RenderIfOwner';

class Billing extends Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    componentDidMount() {
        if (SHOULD_LOG_ANALYTICS) {
            logEvent('PAGE VIEW: DASHBOARD > PROJECT > SETTINGS > BILLING');
        }
        this.props.getSmtpConfig(this.props.currentProjectId);
    }

    render() {
        const {
            location: { pathname },
            alertEnable,
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
                <BreadCrumbItem route={pathname} name="Billing" />
                <div id="billingSetting" className="Margin-vertical--12">
                    <ShouldRender if={!alertEnable}>
                        <AlertDisabledWarning page="Billing" />
                    </ShouldRender>
                    <ShouldRender if={currentProject}>
                        <AlertAdvanceOption />
                    </ShouldRender>
                    <CustomerBalance />
                    <AlertCharges />
                    <ShouldRender if={currentProject}>
                        <ChangePlan />
                    </ShouldRender>
                    <RenderIfOwner>
                        <DeleteProject />
                    </RenderIfOwner>
                </div>
            </Fade>
        );
    }
}

Billing.displayName = 'Billing';

const mapStateToProps = state => {
    const projectId =
        state.project.currentProject && state.project.currentProject._id;
    return {
        currentProjectId: projectId,
        alertEnable:
            state.form.AlertAdvanceOption &&
            state.form.AlertAdvanceOption.values.alertEnable,
        currentProject: state.project.currentProject,
        switchToProjectViewerNav: state.project.switchToProjectViewerNav,
    };
};

const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            getSmtpConfig,
        },
        dispatch
    );
};

Billing.propTypes = {
    location: PropTypes.shape({
        pathname: PropTypes.string,
    }),
    alertEnable: PropTypes.bool,
    currentProject: PropTypes.object,
    currentProjectId: PropTypes.string.isRequired,
    getSmtpConfig: PropTypes.func.isRequired,
    switchToProjectViewerNav: PropTypes.bool,
};

export default connect(mapStateToProps, mapDispatchToProps)(Billing);
