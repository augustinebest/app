import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { reduxForm, Field } from 'redux-form';
import ClickOutside from 'react-click-outside';
import { FormLoader } from '../basic/Loader';
import ShouldRender from '../basic/ShouldRender';
import { ValidateField } from '../../config';
import { history } from '../../store';
import { RenderField } from '../basic/RenderField';
import { RenderSelect } from '../basic/RenderSelect';
import { closeModal } from '../../actions/modal';
import { editContainerSecurity } from '../../actions/security';

class EditContainerSecurity extends Component {
    componentDidUpdate(prevProps) {
        const { propArr, isRequesting, closeModal, editError } = this.props;
        const { containerSecurityId } = propArr[0];

        if (prevProps.isRequesting !== isRequesting) {
            if (!isRequesting && !editError) {
                closeModal({ id: containerSecurityId });
            }
        }
    }

    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyBoard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.handleCloseModal();
            case 'Enter':
                return document.getElementById('editContainerBtn').click();
            default:
                return false;
        }
    };

    handleCloseModal = () => {
        const { propArr } = this.props;
        const { containerSecurityId } = propArr[0];
        this.props.closeModal({
            id: containerSecurityId,
        });
    };

    submitForm = values => {
        const { editContainerSecurity, propArr } = this.props;
        const { projectId, componentId, containerSecurityId } = propArr[0];

        if (!values) return;

        editContainerSecurity({
            projectId,
            componentId,
            containerSecurityId,
            data: values,
        }).then(data => {
            history.replace(
                `/dashboard/project/${this.props.projectSlug}/component/${this.props.componentSlug}/security/container/${data.data.slug}`
            );
        });
    };

    render() {
        const {
            isRequesting,
            closeModal,
            editError,
            handleSubmit,
            propArr,
            dockerCredentials,
            resourceCategoryList,
        } = this.props;
        const { containerSecurityId } = propArr[0];

        return (
            <div className="ModalLayer-wash Box-root Flex-flex Flex-alignItems--flexStart Flex-justifyContent--center">
                <div
                    className="ModalLayer-contents"
                    tabIndex={-1}
                    style={{ marginTop: 40 }}
                >
                    <div className="bs-BIM">
                        <div
                            className="bs-Modal bs-Modal--medium"
                            style={{ width: 600 }}
                        >
                            <ClickOutside
                                onClickOutside={this.handleCloseModal}
                            >
                                <div className="bs-Modal-header">
                                    <div className="bs-Modal-header-copy">
                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                            <span>Edit Container Security</span>
                                        </span>
                                    </div>
                                </div>
                                <form
                                    id="editContainerSecurityForm"
                                    onSubmit={handleSubmit(this.submitForm)}
                                >
                                    <div className="bs-Modal-content">
                                        <div
                                            className="bs-ContentSection-content Box-root Box-background--offset Box-divider--surface-bottom-1 Padding-vertical--2"
                                            style={{ boxShadow: 'none' }}
                                        >
                                            <div>
                                                <div className="bs-Fieldset-wrapper Box-root Margin-bottom--2">
                                                    <fieldset className="bs-Fieldset">
                                                        <div className="bs-Fieldset-rows">
                                                            <div className="bs-Fieldset-row bs-u-justify--center">
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
                                                                        name="name"
                                                                        id="name"
                                                                        placeholder="Container name"
                                                                        disabled={
                                                                            isRequesting
                                                                        }
                                                                        validate={
                                                                            ValidateField.text
                                                                        }
                                                                        autoFocus={
                                                                            true
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
                                                                <div className="bs-Fieldset-row bs-u-justify--center">
                                                                    <label className="bs-Fieldset-label">
                                                                        Resource
                                                                        Category
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
                                                                                isRequesting
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
                                                            <div className="bs-Fieldset-row bs-u-justify--center">
                                                                <label className="bs-Fieldset-label">
                                                                    Docker
                                                                    Credential
                                                                </label>
                                                                <div className="bs-Fieldset-fields">
                                                                    <Field
                                                                        className="db-select-nw"
                                                                        component={
                                                                            RenderSelect
                                                                        }
                                                                        name="dockerCredential"
                                                                        id="dockerCredential"
                                                                        placeholder="Docker Credential"
                                                                        required="required"
                                                                        style={{
                                                                            height:
                                                                                '28px',
                                                                        }}
                                                                        options={[
                                                                            {
                                                                                value:
                                                                                    '',
                                                                                label:
                                                                                    'Select a Docker Credential',
                                                                            },
                                                                            ...(dockerCredentials &&
                                                                            dockerCredentials.length >
                                                                                0
                                                                                ? dockerCredentials.map(
                                                                                      dockerCredential => ({
                                                                                          value:
                                                                                              dockerCredential._id,
                                                                                          label:
                                                                                              dockerCredential.dockerRegistryUrl,
                                                                                      })
                                                                                  )
                                                                                : []),
                                                                        ]}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="bs-Fieldset-row bs-u-justify--center">
                                                                <label className="bs-Fieldset-label">
                                                                    Image Path
                                                                </label>
                                                                <div className="bs-Fieldset-fields">
                                                                    <Field
                                                                        className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                        component={
                                                                            RenderField
                                                                        }
                                                                        type="text"
                                                                        name="imagePath"
                                                                        id="imagePath"
                                                                        placeholder="oneuptime/home"
                                                                        disabled={
                                                                            isRequesting
                                                                        }
                                                                        validate={
                                                                            ValidateField.text
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="bs-Fieldset-row bs-u-justify--center">
                                                                <label className="bs-Fieldset-label">
                                                                    Image Tags
                                                                </label>
                                                                <div className="bs-Fieldset-fields">
                                                                    <Field
                                                                        className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                        component={
                                                                            RenderField
                                                                        }
                                                                        type="text"
                                                                        name="imageTags"
                                                                        id="imageTags"
                                                                        placeholder="latest"
                                                                        disabled={
                                                                            isRequesting
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </fieldset>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bs-Modal-footer">
                                        <div
                                            className="bs-Modal-footer-actions"
                                            style={{ width: 280 }}
                                        >
                                            <ShouldRender
                                                if={!isRequesting && editError}
                                            >
                                                <div
                                                    id="addCredentialError"
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
                                                                    color:
                                                                        'red',
                                                                }}
                                                            >
                                                                {editError}
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
                                                onClick={e => {
                                                    e.preventDefault();
                                                    closeModal({
                                                        id: containerSecurityId,
                                                    });
                                                }}
                                                id="cancelEditContainerBtn"
                                                disabled={isRequesting}
                                            >
                                                <span>Cancel</span>
                                                <span className="cancel-btn__keycode">
                                                    Esc
                                                </span>
                                            </button>
                                            <button
                                                id="editContainerBtn"
                                                className="bs-Button bs-Button bs-Button--blue btn__modal"
                                                type="submit"
                                                disabled={isRequesting}
                                            >
                                                {!isRequesting && (
                                                    <>
                                                        <span>
                                                            Update Container
                                                            Security
                                                        </span>
                                                        <span className="create-btn__keycode">
                                                            <span className="keycode__icon keycode__icon--enter" />
                                                        </span>
                                                    </>
                                                )}
                                                {isRequesting && <FormLoader />}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </ClickOutside>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

EditContainerSecurity.displayName = 'EditContainerSecurity';

EditContainerSecurity.propTypes = {
    isRequesting: PropTypes.bool,
    editError: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    propArr: PropTypes.array,
    closeModal: PropTypes.func,
    handleSubmit: PropTypes.func,
    componentSlug: PropTypes.string,
    editContainerSecurity: PropTypes.func,
    dockerCredentials: PropTypes.array,
    resourceCategoryList: PropTypes.array,
    projectSlug: PropTypes.string,
};

const mapStateToProps = state => {
    return {
        isRequesting: state.security.editContainerSecurity.requesting,
        editError: state.security.editContainerSecurity.error,
        projectSlug:
            state.project.currentProject && state.project.currentProject.slug,
        componentSlug:
            state.component.currentComponent.component &&
            state.component.currentComponent.component.slug,
        initialValues: {
            name: state.security.containerSecurity.name,
            dockerCredential:
                state.security.containerSecurity.dockerCredential._id,
            imagePath: state.security.containerSecurity.imagePath,
            imageTags: state.security.containerSecurity.imageTags,
            resourceCategory: state.security.containerSecurity.resourceCategory
                ? state.security.containerSecurity.resourceCategory._id
                : '',
        },
        dockerCredentials: state.credential.dockerCredentials,
        resourceCategoryList:
            state.resourceCategories.resourceCategoryListForNewResource
                .resourceCategories,
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators({ closeModal, editContainerSecurity }, dispatch);

const EditContainerSecurityForm = reduxForm({
    form: 'EditContainerSecurityForm',
    enableReinitialize: true,
    destroyOnUnmount: true,
})(EditContainerSecurity);

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EditContainerSecurityForm);
