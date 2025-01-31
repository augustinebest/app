import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { reduxForm, Field, SubmissionError } from 'redux-form';
import ClickOutside from 'react-click-outside';
import { closeModal } from '../../actions/modal';
import ShouldRender from '../basic/ShouldRender';
import { FormLoader } from '../basic/Loader';
import { RenderField } from '../basic/RenderField';
import { UploadFile } from '../basic/UploadFile';
import {
    uploadCertFile,
    uploadPrivateKey,
    removeCertFile,
    removePrivateKeyFile,
    uploadCertFileSuccess,
    uploadPrivateKeySuccess,
} from '../../actions/statusPage';
import { updateDomain } from '../../actions/domain';
import { Validate, SHOULD_LOG_ANALYTICS } from '../../config';
import { logEvent } from '../../analytics';

// eslint-disable-next-line no-unused-vars
function validate(_values) {
    const error = undefined;
    return error;
}

class EditMoreDomainModal extends React.Component {
    componentDidMount() {
        const {
            domain,
            uploadCertFileSuccess,
            uploadPrivateKeySuccess,
        } = this.props;
        uploadCertFileSuccess(domain.cert);
        uploadPrivateKeySuccess(domain.privateKey);

        window.addEventListener('keydown', this.handleKeyBoard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    submitForm = values => {
        const {
            projectId,
            statusPageId,
            updateDomain,
            certFile,
            privateKeyFile,
            closeModal,
            domain,
        } = this.props;

        if (!values.domain || !values.domain.trim()) {
            throw new SubmissionError({
                domain: 'Domain is required',
            });
        }

        if (!Validate.isDomain(values.domain)) {
            throw new SubmissionError({
                domain: 'Domain is not valid.',
            });
        }

        const data = {
            projectId,
            statusPageId,
            domain: values.domain,
            domainId: domain._id,
            enableHttps: values.enableHttps,
            autoProvisioning: values.autoProvisioning,
        };

        if (values.enableHttps && !values.autoProvisioning) {
            data.cert = certFile.file;
            data.privateKey = privateKeyFile.file;
        }

        updateDomain(data).then(() => {
            if (!this.props.updateDomainError) {
                this.props.removeCertFile();
                this.props.removePrivateKeyFile();
                closeModal({
                    id: statusPageId,
                });

                if (SHOULD_LOG_ANALYTICS) {
                    logEvent(
                        'EVENT: DASHBOARD > PROJECT > STATUS PAGES > STATUS PAGE > DOMAIN UPDATED'
                    );
                }
            }
        });
    };

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.handleCloseModal();
            case 'Enter':
                return document.getElementById('updateCustomDomainBtn').click();
            default:
                return false;
        }
    };

    handleCloseModal = () => {
        this.props.closeModal({
            id: this.props.statusPageId,
        });
    };

    changeCertFile = e => {
        e.preventDefault();
        const { projectId, uploadCertFile } = this.props;

        const reader = new FileReader();
        const file = e.target.files[0];

        reader.onloadend = () => {
            uploadCertFile(projectId, file);
        };
        try {
            reader.readAsDataURL(file);
        } catch (error) {
            return;
        }
    };

    changePrivateKey = e => {
        e.preventDefault();
        const { projectId, uploadPrivateKey } = this.props;

        const reader = new FileReader();
        const file = e.target.files[0];

        reader.onloadend = () => {
            uploadPrivateKey(projectId, file);
        };
        try {
            reader.readAsDataURL(file);
        } catch (error) {
            return;
        }
    };

    removeCertFile = () => {
        this.props.removeCertFile();
    };

    removePrivateKeyFile = () => {
        this.props.removePrivateKeyFile();
    };

    render() {
        const {
            requesting,
            updateDomainError,
            closeModal,
            handleSubmit,
            statusPageId,
            certFile,
            privateKeyFile,
            formValues,
        } = this.props;

        return (
            <div
                className="ModalLayer-contents"
                tabIndex="-1"
                style={{ marginTop: '40px' }}
            >
                <div className="bs-BIM">
                    <div className="bs-Modal" style={{ width: 630 }}>
                        <ClickOutside onClickOutside={this.handleCloseModal}>
                            <div className="bs-Modal-header">
                                <div className="bs-Modal-header-copy">
                                    <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                        <span>Edit Custom Domain</span>
                                    </span>
                                </div>
                            </div>
                            <form
                                id="editMoreDomainModal"
                                onSubmit={handleSubmit(this.submitForm)}
                            >
                                <div className="bs-Modal-content">
                                    <div className="bs-Fieldset-wrapper Box-root Margin-bottom--2">
                                        <fieldset className="Margin-bottom--16">
                                            <div className="bs-Fieldset-rows">
                                                <div
                                                    className="bs-Fieldset-row"
                                                    style={{ padding: 0 }}
                                                >
                                                    <label
                                                        className="bs-Fieldset-label Text-align--left"
                                                        htmlFor="customDomain"
                                                    >
                                                        <span>
                                                            Custom Domain
                                                        </span>
                                                    </label>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <div
                                                            className="bs-Fieldset-field"
                                                            style={{
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <Field
                                                                component={
                                                                    RenderField
                                                                }
                                                                name="domain"
                                                                placeholder="status.example.com"
                                                                id="customDomain"
                                                                className="bs-TextInput"
                                                                style={{
                                                                    width:
                                                                        '100%',
                                                                    padding:
                                                                        '3px 5px',
                                                                }}
                                                                autoFocus={true}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>
                                        <div
                                            className="bs-Fieldset-row"
                                            style={{ padding: '0px 20px' }}
                                        >
                                            <label className="bs-Fieldset-label">
                                                <span></span>
                                            </label>
                                            <div
                                                className="bs-Fieldset-fields bs-Fieldset-fields--wide"
                                                style={{ padding: 0 }}
                                            >
                                                <div
                                                    className="Box-root"
                                                    style={{
                                                        height: '5px',
                                                    }}
                                                ></div>
                                                <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--column Flex-justifyContent--flexStart">
                                                    <label className="Checkbox">
                                                        <Field
                                                            component="input"
                                                            type="checkbox"
                                                            name="enableHttps"
                                                            className="Checkbox-source"
                                                            id="enableHttps"
                                                        />
                                                        <div className="Checkbox-box Box-root Margin-top--2 Margin-right--2">
                                                            <div className="Checkbox-target Box-root">
                                                                <div className="Checkbox-color Box-root"></div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="Box-root"
                                                            style={{
                                                                paddingLeft:
                                                                    '5px',
                                                            }}
                                                        >
                                                            <span>
                                                                Enable HTTPS
                                                            </span>
                                                            <label className="bs-Fieldset-explanation">
                                                                <span></span>
                                                            </label>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <ShouldRender
                                            if={
                                                formValues &&
                                                formValues.enableHttps
                                            }
                                        >
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: '0px 20px' }}
                                            >
                                                <label className="bs-Fieldset-label">
                                                    <span></span>
                                                </label>
                                                <div
                                                    className="bs-Fieldset-fields bs-Fieldset-fields--wide"
                                                    style={{ padding: 0 }}
                                                >
                                                    <div
                                                        className="Box-root"
                                                        style={{
                                                            height: '5px',
                                                        }}
                                                    ></div>
                                                    <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--column Flex-justifyContent--flexStart">
                                                        <label className="Checkbox">
                                                            <Field
                                                                component="input"
                                                                type="checkbox"
                                                                name="autoProvisioning"
                                                                className="Checkbox-source"
                                                                id="autoProvisioning"
                                                            />
                                                            <div className="Checkbox-box Box-root Margin-top--2 Margin-right--2">
                                                                <div className="Checkbox-target Box-root">
                                                                    <div className="Checkbox-color Box-root"></div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                className="Box-root"
                                                                style={{
                                                                    paddingLeft:
                                                                        '5px',
                                                                }}
                                                            >
                                                                <span>
                                                                    Enable
                                                                    Auto-SSL
                                                                    Provisioning
                                                                </span>
                                                                <label className="bs-Fieldset-explanation">
                                                                    <span>
                                                                        Auto-SSL
                                                                        provisioning
                                                                        might
                                                                        take up
                                                                        to 72
                                                                        hours to
                                                                        propagate
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </ShouldRender>
                                        <ShouldRender
                                            if={
                                                formValues &&
                                                formValues.enableHttps &&
                                                !formValues.autoProvisioning
                                            }
                                        >
                                            <>
                                                <fieldset>
                                                    <div
                                                        className="bs-Fieldset-row"
                                                        style={{ padding: 0 }}
                                                    >
                                                        <label
                                                            className="bs-Fieldset-label Text-align--left"
                                                            htmlFor="cert"
                                                        >
                                                            <span>
                                                                Certificate
                                                            </span>
                                                        </label>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <div className="Box-root Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween">
                                                                <div>
                                                                    <label
                                                                        className="bs-Button bs-DeprecatedButton bs-FileUploadButton"
                                                                        type="button"
                                                                    >
                                                                        <ShouldRender
                                                                            if={
                                                                                !certFile.file
                                                                            }
                                                                        >
                                                                            <span className="bs-Button--icon bs-Button--new"></span>
                                                                            <span>
                                                                                Upload
                                                                                Certificate
                                                                                File
                                                                            </span>
                                                                        </ShouldRender>
                                                                        <ShouldRender
                                                                            if={
                                                                                certFile.file
                                                                            }
                                                                        >
                                                                            <span className="bs-Button--icon bs-Button--edit"></span>
                                                                            <span>
                                                                                Change
                                                                                Certificate
                                                                                File
                                                                            </span>
                                                                        </ShouldRender>
                                                                        <div className="bs-FileUploadButton-inputWrap">
                                                                            <Field
                                                                                className="bs-FileUploadButton-input"
                                                                                component={
                                                                                    UploadFile
                                                                                }
                                                                                name="certFile"
                                                                                id="certFile"
                                                                                onChange={
                                                                                    this
                                                                                        .changeCertFile
                                                                                }
                                                                                disabled={
                                                                                    certFile.requesting
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                                <ShouldRender
                                                                    if={
                                                                        certFile.file
                                                                    }
                                                                >
                                                                    <div
                                                                        style={{
                                                                            padding:
                                                                                '0',
                                                                            display:
                                                                                'block',
                                                                        }}
                                                                    >
                                                                        <button
                                                                            className="bs-Button bs-DeprecatedButton bs-FileUploadButton"
                                                                            type="button"
                                                                            onClick={
                                                                                this
                                                                                    .removeCertFile
                                                                            }
                                                                            disabled={
                                                                                certFile.requesting
                                                                            }
                                                                        >
                                                                            <span className="bs-Button--icon bs-Button--delete"></span>
                                                                            <span>
                                                                                Remove
                                                                                Certificate
                                                                                File
                                                                            </span>
                                                                        </button>
                                                                    </div>
                                                                </ShouldRender>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>
                                                <fieldset>
                                                    <div
                                                        className="bs-Fieldset-row"
                                                        style={{ padding: 0 }}
                                                    >
                                                        <label
                                                            className="bs-Fieldset-label Text-align--left"
                                                            htmlFor="cert"
                                                        >
                                                            <span>
                                                                Private Key
                                                            </span>
                                                        </label>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <div className="Box-root Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween">
                                                                <div>
                                                                    <label
                                                                        className="bs-Button bs-DeprecatedButton bs-FileUploadButton"
                                                                        type="button"
                                                                    >
                                                                        <ShouldRender
                                                                            if={
                                                                                !privateKeyFile.file
                                                                            }
                                                                        >
                                                                            <span className="bs-Button--icon bs-Button--new"></span>
                                                                            <span>
                                                                                Upload
                                                                                Private
                                                                                Key
                                                                            </span>
                                                                        </ShouldRender>
                                                                        <ShouldRender
                                                                            if={
                                                                                privateKeyFile.file
                                                                            }
                                                                        >
                                                                            <span className="bs-Button--icon bs-Button--edit"></span>
                                                                            <span>
                                                                                Change
                                                                                Private
                                                                                Key
                                                                            </span>
                                                                        </ShouldRender>
                                                                        <div className="bs-FileUploadButton-inputWrap">
                                                                            <Field
                                                                                className="bs-FileUploadButton-input"
                                                                                component={
                                                                                    UploadFile
                                                                                }
                                                                                name="privateKeyFile"
                                                                                id="privateKeyFile"
                                                                                onChange={
                                                                                    this
                                                                                        .changePrivateKey
                                                                                }
                                                                                disabled={
                                                                                    privateKeyFile.requesting
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                                <ShouldRender
                                                                    if={
                                                                        privateKeyFile.file
                                                                    }
                                                                >
                                                                    <div
                                                                        style={{
                                                                            padding:
                                                                                '0',
                                                                            display:
                                                                                'block',
                                                                        }}
                                                                    >
                                                                        <button
                                                                            className="bs-Button bs-DeprecatedButton bs-FileUploadButton"
                                                                            type="button"
                                                                            onClick={
                                                                                this
                                                                                    .removePrivateKeyFile
                                                                            }
                                                                            disabled={
                                                                                privateKeyFile.requesting
                                                                            }
                                                                        >
                                                                            <span className="bs-Button--icon bs-Button--delete"></span>
                                                                            <span>
                                                                                Remove
                                                                                Private
                                                                                Key
                                                                            </span>
                                                                        </button>
                                                                    </div>
                                                                </ShouldRender>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>
                                            </>
                                        </ShouldRender>
                                    </div>
                                </div>
                                <div className="bs-Modal-footer">
                                    <div className="bs-Modal-footer-actions">
                                        <ShouldRender if={updateDomainError}>
                                            <div
                                                className="bs-Tail-copy"
                                                style={{ width: 200 }}
                                                id="updateDomainError"
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
                                                            {updateDomainError}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </ShouldRender>
                                        <button
                                            className="bs-Button bs-DeprecatedButton btn__modal"
                                            type="button"
                                            onClick={() =>
                                                closeModal({
                                                    id: statusPageId,
                                                })
                                            }
                                        >
                                            <span>Cancel</span>
                                            <span className="cancel-btn__keycode">
                                                Esc
                                            </span>
                                        </button>
                                        <button
                                            id="updateCustomDomainBtn"
                                            className="bs-Button bs-DeprecatedButton bs-Button--blue btn__modal"
                                            disabled={requesting}
                                            type="submit"
                                        >
                                            {!requesting && (
                                                <>
                                                    <span>Update Domain</span>
                                                    <span className="create-btn__keycode">
                                                        <span className="keycode__icon keycode__icon--enter" />
                                                    </span>
                                                </>
                                            )}
                                            {requesting && <FormLoader />}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </ClickOutside>
                    </div>
                </div>
            </div>
        );
    }
}

EditMoreDomainModal.displayName = 'EditMoreDomainModal';

EditMoreDomainModal.propTypes = {
    closeModal: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    requesting: PropTypes.bool,
    statusPageId: PropTypes.string,
    projectId: PropTypes.string,
    updateDomainError: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    uploadCertFile: PropTypes.func,
    uploadPrivateKey: PropTypes.func,
    certFile: PropTypes.object,
    privateKeyFile: PropTypes.object,
    removeCertFile: PropTypes.func,
    removePrivateKeyFile: PropTypes.func,
    updateDomain: PropTypes.func,
    domain: PropTypes.object,
    formValues: PropTypes.object,
    uploadCertFileSuccess: PropTypes.func,
    uploadPrivateKeySuccess: PropTypes.func,
};

const EditMoreDomainForm = reduxForm({
    form: 'EditMoreDomainForm',
    enableReinitialize: false,
    destroyOnUnmount: true,
    validate,
})(EditMoreDomainModal);

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            closeModal,
            uploadCertFile,
            uploadPrivateKey,
            removeCertFile,
            removePrivateKeyFile,
            updateDomain,
            uploadCertFileSuccess,
            uploadPrivateKeySuccess,
        },
        dispatch
    );

const mapStateToProps = state => {
    const domainObj = state.modal.modals[0].domain;
    const initialValues = {
        domain: domainObj.domain,
        autoProvisioning: domainObj.autoProvisioning,
        enableHttps: domainObj.enableHttps,
    };

    return {
        statusPageId: state.modal.modals[0].statusPageId,
        projectId: state.modal.modals[0].projectId,
        formValues:
            state.form.EditMoreDomainForm &&
            state.form.EditMoreDomainForm.values,
        requesting: state.statusPage.updateDomain.requesting,
        updateDomainError: state.statusPage.updateDomain.error,
        certFile: state.statusPage.certFile,
        privateKeyFile: state.statusPage.privateKeyFile,
        initialValues,
        domain: domainObj,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditMoreDomainForm);
