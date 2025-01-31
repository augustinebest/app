/**
 * @description renders the children if the user is an admin or owner of the project
 * @param children children component
 * @param currentProject the current project
 */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { User } from '../../config';
import isOwnerOrAdmin from '../../utils/isOwnerOrAdmin';

const RenderIfOwnerOrAdmin = ({ currentProject, children }) => {
    const userId = User.getUserId();

    return isOwnerOrAdmin(userId, currentProject) ? children : null;
};

RenderIfOwnerOrAdmin.propTypes = {
    currentProject: PropTypes.object,
};

const mapStateToProps = state => {
    return {
        currentProject: state.project.currentProject,
    };
};

export default connect(mapStateToProps)(RenderIfOwnerOrAdmin);
