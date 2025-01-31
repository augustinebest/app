import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Fade from 'react-reveal/Fade';
import EmailTemplatesBox from '../components/emailTemplates/EmailTemplatesBox';
import EmailSmtpBox from '../components/emailTemplates/EmailSmtpBox';
import { getEmailTemplates, getSmtpConfig } from '../actions/emailTemplates';
import { logEvent } from '../analytics';
import { SHOULD_LOG_ANALYTICS } from '../config';
import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import getParentRoute from '../utils/getParentRoute';
import AdvancedIncidentNotification from '../components/settings/AdvancedIncidentNotification';

class EmailTemplates extends Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    ready = () => {
        this.props.getEmailTemplates(this.props.currentProject._id);
        this.props.getSmtpConfig(this.props.currentProject._id);
    };

    componentDidMount() {
        if (SHOULD_LOG_ANALYTICS) {
            logEvent(
                'PAGE VIEW: DASHBOARD > PROJECT > SETTINGS > EMAIL TEMPLATE'
            );
        }

        this.ready();
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps?.currentProject?._id !== this.props?.currentProject?._id
        ) {
            this.ready();
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
                <BreadCrumbItem route={pathname} name="Email" />
                <EmailTemplatesBox />
                <EmailSmtpBox />
                <AdvancedIncidentNotification type="email" />
            </Fade>
        );
    }
}

EmailTemplates.propTypes = {
    getEmailTemplates: PropTypes.func.isRequired,
    currentProject: PropTypes.object.isRequired,
    getSmtpConfig: PropTypes.func.isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string,
    }),
    switchToProjectViewerNav: PropTypes.bool,
};

const mapDispatchToProps = dispatch =>
    bindActionCreators({ getEmailTemplates, getSmtpConfig }, dispatch);

const mapStateToProps = state => {
    return {
        currentProject: state.project.currentProject,
        switchToProjectViewerNav: state.project.switchToProjectViewerNav,
    };
};

EmailTemplates.displayName = 'EmailTemplates';

export default connect(mapStateToProps, mapDispatchToProps)(EmailTemplates);
