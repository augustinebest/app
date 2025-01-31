import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import Fade from 'react-reveal/Fade';
import { logEvent } from '../analytics';
import { SHOULD_LOG_ANALYTICS, User, PricingPlan } from '../config';
import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import getParentRoute from '../utils/getParentRoute';
import Sso from '../components/settings/Sso';
import { history } from '../store';

class SsoPage extends Component {
    componentDidMount() {
        if (SHOULD_LOG_ANALYTICS) {
            logEvent('PAGE VIEW: DASHBOARD > PROJECT > SETTINGS > INTEGRATION');
        }

        const currentProject = JSON.parse(User.getProject());
        const isScalePlan = currentProject?.stripePlanId
            ? PricingPlan.getPlanById(currentProject.stripePlanId).category ===
              'Scale'
            : false;
        if (!isScalePlan) {
            history.push(`/dashboard/project/${currentProject.slug}`);
        }
    }
    render() {
        const {
            location: { pathname },
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
                <BreadCrumbItem route={pathname} name="Sso" />
                <Sso projectId={projectId} />
            </Fade>
        );
    }
}

SsoPage.propTypes = {
    location: PropTypes.shape({
        pathname: PropTypes.string,
    }),
    currentProject: PropTypes.object.isRequired,
    switchToProjectViewerNav: PropTypes.bool,
};

SsoPage.displayName = 'SsoPage';

const mapStateToProps = state => {
    return {
        currentProject: state.project.currentProject,
        switchToProjectViewerNav: state.project.switchToProjectViewerNav,
    };
};

export default connect(mapStateToProps)(SsoPage);
