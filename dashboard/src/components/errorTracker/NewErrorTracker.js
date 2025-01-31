import React, { Component } from 'react';
import { RenderField } from '../basic/RenderField';
import { ValidateField } from '../../config';
import { Field, reduxForm, formValueSelector } from 'redux-form';
import { FormLoader } from '../basic/Loader';
import ShouldRender from '../basic/ShouldRender';
import { history } from '../../store';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { logEvent } from '../../analytics';
import { SHOULD_LOG_ANALYTICS } from '../../config';
import { bindActionCreators } from 'redux';
import {
    createErrorTracker,
    editErrorTrackerSwitch,
    editErrorTracker,
} from '../../actions/errorTracker';
import { RenderSelect } from '../basic/RenderSelect';
const selector = formValueSelector('NewErrorTracker');

class NewErrorTracker extends Component {
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyBoard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }
    handleKeyBoard = e => {
        switch (e.key) {
            case 'Enter':
                if (document.getElementById('editErrorTrackerButton'))
                    return document
                        .getElementById('editErrorTrackerButton')
                        .click();
                else return false;
            default:
                return false;
        }
    };
    submitForm = values => {
        const thisObj = this;
        const postObj = {};
        postObj.name = values[`name`];
        if (values[`resourceCategory`]) {
            postObj.resourceCategory = values[`resourceCategory`];
        }
        if (!this.props.edit) {
            this.props
                .createErrorTracker(
                    this.props.currentProject._id,
                    this.props.componentId,
                    postObj
                )
                .then(
                    () => {
                        thisObj.props.reset();
                        if (SHOULD_LOG_ANALYTICS) {
                            logEvent(
                                'EVENT: DASHBOARD > PROJECT > COMPONENT > ERROR TRACKING > NEW ERROR TRACKING',
                                values
                            );
                        }
                    },
                    error => {
                        if (error && error.message) {
                            return error;
                        }
                    }
                );
        } else {
            const {
                editErrorTracker,
                currentProject,
                componentId,
                errorTracker,
            } = this.props;
            editErrorTracker(
                currentProject._id,
                componentId,
                errorTracker._id,
                postObj
            ).then(
                data => {
                    history.replace(
                        `/dashboard/project/${this.props.currentProject.slug}/component/${this.props.componentSlug}/error-trackers/${data.data.slug}`
                    );
                    thisObj.props.reset();
                    if (SHOULD_LOG_ANALYTICS) {
                        logEvent(
                            'EVENT: DASHBOARD > PROJECT > COMPONENT > ERROR TRACKING > EDIT ERROR TRACKING',
                            values
                        );
                    }
                },
                error => {
                    if (error && error.message) {
                        return error;
                    }
                }
            );
        }
    };
    cancelEdit = () => {
        const { editErrorTrackerSwitch, errorTracker } = this.props;
        editErrorTrackerSwitch(errorTracker._id);
    };
    render() {
        const {
            handleSubmit,
            requesting,
            edit,
            errorTracker,
            resourceCategoryList,
        } = this.props;
        return (
            <div className="Box-root Margin-bottom--12">
                <div className="bs-ContentSection Card-root Card-shadow--medium">
                    <div className="Box-root">
                        <div className="bs-ContentSection-content Box-root Box-divider--surface-bottom-1 Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                            <div className="Box-root">
                                <ShouldRender if={!edit}>
                                    <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                        <span>New Error Tracker </span>
                                    </span>
                                    <p>
                                        <span>
                                            Create an error tracker so you and
                                            your team can monitor the errors
                                            being tracked by it.
                                        </span>
                                    </p>
                                </ShouldRender>
                                <ShouldRender if={edit}>
                                    <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                        <span>Edit Tracker </span>
                                    </span>
                                    <p>
                                        <span
                                            id={`error-tracker-edit-title-${errorTracker?.name}`}
                                        >
                                            {`Edit Tracker  ${errorTracker?.name}`}
                                        </span>
                                    </p>
                                </ShouldRender>
                            </div>
                        </div>
                        <form
                            id="form-new-error-tracker"
                            onSubmit={handleSubmit(this.submitForm)}
                        >
                            <div
                                className="bs-ContentSection-content Box-root Box-background--offset Box-divider--surface-bottom-1 Padding-vertical--2"
                                style={{ boxShadow: 'none' }}
                            >
                                <div>
                                    <div className="bs-Fieldset-wrapper Box-root Margin-bottom--2">
                                        <fieldset className="bs-Fieldset">
                                            <div className="bs-Fieldset-rows">
                                                <div className="bs-Fieldset-row">
                                                    <label className="bs-Fieldset-label">
                                                        Name
                                                    </label>
                                                    <div className="bs-Fieldset-fields">
                                                        <Field
                                                            className="db-BusinessSettings-input TextInput bs-TextInput"
                                                            component={
                                                                RenderField
                                                            }
                                                            type="text"
                                                            name={`name`}
                                                            id="name"
                                                            placeholder="Error Tracker Name"
                                                            validate={
                                                                ValidateField.text
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <ShouldRender
                                                    if={
                                                        false &&
                                                        resourceCategoryList &&
                                                        resourceCategoryList.length >
                                                            0
                                                    }
                                                >
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Resource Category
                                                        </label>
                                                        <div className="bs-Fieldset-fields">
                                                            <Field
                                                                className="db-select-nw"
                                                                component={
                                                                    RenderSelect
                                                                }
                                                                name="resourceCategory"
                                                                id="resourceCategory"
                                                                placeholder="Choose Category"
                                                                disabled={
                                                                    requesting
                                                                }
                                                                options={[
                                                                    {
                                                                        value:
                                                                            '',
                                                                        label:
                                                                            'Select category',
                                                                    },
                                                                    ...(resourceCategoryList &&
                                                                    resourceCategoryList.length >
                                                                        0
                                                                        ? resourceCategoryList.map(
                                                                              category => ({
                                                                                  value:
                                                                                      category._id,
                                                                                  label:
                                                                                      category.name,
                                                                              })
                                                                          )
                                                                        : []),
                                                                ]}
                                                            />
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                            </div>
                                        </fieldset>
                                    </div>
                                </div>
                            </div>
                            <div className="bs-ContentSection-footer bs-ContentSection-content Box-root Box-background--white Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--12">
                                <div className="bs-Tail-copy">
                                    <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart">
                                        <ShouldRender
                                            if={
                                                this.props.errorTrackerState
                                                    .newErrorTracker.error
                                            }
                                        >
                                            <div className="Box-root Margin-right--8">
                                                <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                            </div>
                                            <div className="Box-root">
                                                <span style={{ color: 'red' }}>
                                                    {
                                                        this.props
                                                            .errorTrackerState
                                                            .newErrorTracker
                                                            .error
                                                    }
                                                </span>
                                            </div>
                                        </ShouldRender>
                                        <ShouldRender
                                            if={
                                                this.props.errorTrackerState
                                                    .editErrorTracker.error
                                            }
                                        >
                                            <div className="Box-root Margin-right--8">
                                                <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                            </div>
                                            <div className="Box-root">
                                                <span style={{ color: 'red' }}>
                                                    {
                                                        this.props
                                                            .errorTrackerState
                                                            .editErrorTracker
                                                            .error
                                                    }
                                                </span>
                                            </div>
                                        </ShouldRender>
                                    </div>
                                </div>
                                <ShouldRender if={!edit}>
                                    <div>
                                        <ShouldRender
                                            if={
                                                this.props.showCancelBtn &&
                                                this.props.toggleForm
                                            }
                                        >
                                            <button
                                                className="bs-Button"
                                                disabled={requesting}
                                                onClick={this.props.toggleForm}
                                                type="button"
                                            >
                                                <span>Cancel</span>
                                            </button>
                                        </ShouldRender>
                                        <button
                                            id="addErrorTrackerButton"
                                            className="bs-Button bs-Button--blue"
                                            type="submit"
                                        >
                                            <ShouldRender if={!requesting}>
                                                <span>Add Error Tracker</span>
                                            </ShouldRender>

                                            <ShouldRender if={requesting}>
                                                <FormLoader />
                                            </ShouldRender>
                                        </button>
                                    </div>
                                </ShouldRender>
                                <ShouldRender if={edit}>
                                    <div>
                                        <button
                                            className="bs-Button"
                                            disabled={requesting}
                                            onClick={this.cancelEdit}
                                            type="button"
                                        >
                                            <span>Cancel</span>
                                        </button>
                                        <button
                                            id="editErrorTrackerButton"
                                            className="bs-Button bs-Button--blue"
                                            type="submit"
                                        >
                                            <ShouldRender if={!requesting}>
                                                <span>Edit Tracker </span>
                                            </ShouldRender>

                                            <ShouldRender if={requesting}>
                                                <FormLoader />
                                            </ShouldRender>
                                        </button>
                                    </div>
                                </ShouldRender>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

NewErrorTracker.displayName = 'NewErrorTracker';

const NewErrorTrackerForm = new reduxForm({
    form: 'NewErrorTracker',
    destroyOnUnmount: true,
    enableReinitialize: true,
})(NewErrorTracker);

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            createErrorTracker,
            editErrorTrackerSwitch,
            editErrorTracker,
        },
        dispatch
    );

const mapStateToProps = (state, ownProps) => {
    const name = selector(state, 'name');
    const componentId = ownProps.componentId;
    const requesting = ownProps.edit
        ? state.errorTracker.editErrorTracker.requesting
        : state.errorTracker.newErrorTracker.requesting;
    const currentProject = state.project.currentProject;
    const initialValues = {
        name: ownProps.errorTracker ? ownProps.errorTracker.name : '',
        resourceCategory: ownProps.errorTracker
            ? ownProps.errorTracker.resourceCategory
                ? ownProps.errorTracker.resourceCategory._id
                : ''
            : '',
    };
    return {
        errorTrackerState: state.errorTracker,
        name,
        componentId,
        requesting,
        currentProject,
        initialValues,
        resourceCategoryList:
            state.resourceCategories.resourceCategoryListForNewResource
                .resourceCategories,
    };
};

NewErrorTracker.propTypes = {
    createErrorTracker: PropTypes.func.isRequired,
    errorTrackerState: PropTypes.object.isRequired,
    errorTracker: PropTypes.object,
    handleSubmit: PropTypes.func.isRequired,
    componentId: PropTypes.string,
    componentSlug: PropTypes.string,
    requesting: PropTypes.bool,
    currentProject: PropTypes.object,
    edit: PropTypes.bool,
    editErrorTrackerSwitch: PropTypes.func,
    editErrorTracker: PropTypes.func,
    resourceCategoryList: PropTypes.array,
    showCancelBtn: PropTypes.bool,
    toggleForm: PropTypes.func,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(NewErrorTrackerForm);
