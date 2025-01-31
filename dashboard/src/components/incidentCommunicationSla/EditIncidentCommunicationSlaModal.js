import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { reduxForm, Field } from 'redux-form';
import ClickOutside from 'react-click-outside';
import { updateCommunicationSla } from '../../actions/incidentCommunicationSla';
import { closeModal } from '../../actions/modal';
import ShouldRender from '../basic/ShouldRender';
import { FormLoader } from '../basic/Loader';
import { RenderField } from '../basic/RenderField';
import { fetchMonitors } from '../../actions/monitor';
import MultiSelectDropDown from '../basic/MultiSelectDropDown';

function validate(values) {
    const errors = {};

    if (!values.name || !values.name.trim()) {
        errors.name = 'Communication SLA name is required';
    }
    if (values.duration && values.duration.trim() && isNaN(values.duration)) {
        errors.duration = 'Only numeric values are allowed';
    }
    if (
        values.alertTime &&
        values.alertTime.trim() &&
        isNaN(values.alertTime)
    ) {
        errors.alertTime = 'Only numeric values are allowed';
    }
    if (Number(values.alertTime) >= Number(values.duration)) {
        errors.alertTime = 'Alert time should be less than duration';
    }
    return errors;
}

class EditIncidentCommunicationSlaModal extends React.Component {
    state = {
        monitorError: null,
        selectedProjects: [],
        selectedComponents: [],
        selectedMonitors: [],
        selectData: [],
    };

    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyBoard);

        this.formatData();
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    submitForm = values => {
        const {
            closeModal,
            editIncidentSlaModalId,
            currentProject,
            slaError,
            initialValues,
            updateCommunicationSla,
            fetchMonitors,
        } = this.props;
        const projectId = currentProject._id;
        const incidentSlaId = initialValues._id;
        const postObj = {};

        if (
            this.state.selectedMonitors &&
            this.state.selectedMonitors.length > 0
        ) {
            postObj.monitors = this.state.selectedMonitors;
        }

        const isDuplicate = postObj.monitors
            ? postObj.monitors.length === new Set(postObj.monitors).size
                ? false
                : true
            : false;

        if (isDuplicate) {
            this.setState({
                monitorError: 'Duplicate monitor selection found',
            });
            return;
        }

        postObj.name = values.name;
        postObj.duration = values.duration;
        postObj.isDefault = values.isDefault;
        postObj.alertTime = values.alertTime;

        updateCommunicationSla(projectId, incidentSlaId, postObj).then(() => {
            if (!slaError) {
                fetchMonitors(projectId);
                closeModal({
                    id: editIncidentSlaModalId,
                });
            }
        });
    };

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.handleCloseModal();
            case 'Enter':
                return document.getElementById('createSlaBtn').click();
            default:
                return false;
        }
    };

    handleCloseModal = () => {
        this.props.closeModal({
            id: this.props.editIncidentSlaModalId,
        });
    };

    formatData = () => {
        const monitors = this.props.monitorsList;
        const hash = {};

        monitors.forEach(monitor => {
            const projectId = monitor.projectId._id || monitor.projectId;
            const componentId = monitor.componentId._id || monitor.componentId;
            if (!hash[projectId]) {
                hash[projectId] = {
                    projectName: monitor.projectId?.name,
                    projectId,
                    components: [
                        {
                            componentName: monitor.componentId?.name,
                            componentId,
                            monitors: [
                                {
                                    monitorName: monitor.name,
                                    monitorId: monitor._id,
                                },
                            ],
                        },
                    ],
                };
            } else {
                let monitorAdded = false;
                hash[projectId] = {
                    ...hash[projectId],
                    components: hash[projectId].components.map(componentObj => {
                        if (componentObj.componentId === componentId) {
                            const newMonitor = {
                                monitorName: monitor.name,
                                monitorId: monitor._id,
                            };

                            componentObj.monitors = [
                                ...componentObj.monitors,
                                newMonitor,
                            ];

                            monitorAdded = true;
                        }

                        return componentObj;
                    }),
                };

                if (!monitorAdded) {
                    const componentData = {
                        componentName: monitor.componentId.name,
                        componentId,
                        monitors: [
                            {
                                monitorName: monitor.name,
                                monitorId: monitor._id,
                            },
                        ],
                    };
                    hash[projectId] = {
                        ...hash[projectId],
                        components: [
                            ...hash[projectId].components,
                            componentData,
                        ],
                    };

                    monitorAdded = true;
                }
            }
        });

        const data = [];
        for (const [, value] of Object.entries(hash)) {
            data.push(value);
        }

        this.setState({
            selectData: data,
            selectedMonitors: this.props.initialValues.monitors || [],
        });
    };

    updateState = (value, key) => {
        this.setState(prevState => {
            let currentValue = prevState[key];

            if (currentValue.includes(value)) {
                currentValue = currentValue.filter(val => val !== value);
                this.updateMultipleState(value, key, currentValue);

                return {
                    [key]: currentValue,
                };
            }

            currentValue = [...currentValue, value];
            this.updateMultipleState(value, key, currentValue);

            return {
                [key]: currentValue,
            };
        });
    };

    updateMultipleState = (id, key, databank) => {
        if (key === 'selectedProjects' && databank.includes(id)) {
            const monitorIds = [];
            const componentIds = [];
            this.props.monitorsList.forEach(monitor => {
                if ((monitor.projectId._id || monitor.projectId) === id) {
                    monitorIds.push(monitor._id);
                    componentIds.push(
                        monitor.componentId._id || monitor.componentId
                    );
                }
            });

            return this.setState(prevState => ({
                selectedMonitors: Array.from(
                    new Set([...prevState.selectedMonitors, ...monitorIds])
                ),
                selectedComponents: Array.from(
                    new Set([...prevState.selectedComponents, ...componentIds])
                ),
            }));
        }

        if (key === 'selectedProjects' && !databank.includes(id)) {
            const monitorIds = [];
            const componentIds = [];
            this.props.monitorsList.forEach(monitor => {
                if ((monitor.projectId._id || monitor.projectId) === id) {
                    monitorIds.push(monitor._id);
                    componentIds.push(
                        monitor.componentId._id || monitor.componentId
                    );
                }
            });

            return this.setState(prevState => ({
                selectedMonitors: prevState.selectedMonitors.filter(
                    monitorId => !monitorIds.includes(monitorId)
                ),
                selectedComponents: prevState.selectedComponents.filter(
                    componentId => !componentIds.includes(componentId)
                ),
            }));
        }

        if (key === 'selectedComponents' && databank.includes(id)) {
            const monitorIds = [];
            this.props.monitorsList.forEach(monitor => {
                if ((monitor.componentId._id || monitor.componentId) === id) {
                    monitorIds.push(monitor._id);
                }
            });

            return this.setState(prevState => ({
                selectedMonitors: Array.from(
                    new Set([...prevState.selectedMonitors, ...monitorIds])
                ),
            }));
        }

        if (key === 'selectedComponents' && !databank.includes(id)) {
            const monitorIds = [];
            this.props.monitorsList.forEach(monitor => {
                if ((monitor.componentId._id || monitor.componentId) === id) {
                    monitorIds.push(monitor._id);
                }
            });

            return this.setState(prevState => ({
                selectedMonitors: prevState.selectedMonitors.filter(
                    monitorId => !monitorIds.includes(monitorId)
                ),
            }));
        }
    };

    render() {
        const {
            requesting,
            slaError,
            closeModal,
            handleSubmit,
            editIncidentSlaModalId,
            formValues,
        } = this.props;

        const {
            selectedProjects,
            selectedComponents,
            selectedMonitors,
            selectData,
        } = this.state;

        return (
            <div
                className="ModalLayer-contents"
                tabIndex="-1"
                style={{ marginTop: '40px' }}
            >
                <div className="bs-BIM">
                    <div className="bs-Modal" style={{ width: 600 }}>
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
                                        <span>
                                            Edit Incident Communication SLA
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <form
                                id="communicationSlaForm"
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
                                                        htmlFor="name"
                                                    >
                                                        <span>SLA Name</span>
                                                    </label>
                                                    <div className="bs-Fieldset-fields">
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
                                                                name="name"
                                                                placeholder="SLA name"
                                                                id="name"
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
                                        {formValues && !formValues.isDefault && (
                                            <fieldset className="Margin-bottom--16">
                                                <div className="bs-Fieldset-rows">
                                                    <div
                                                        className="bs-Fieldset-row"
                                                        style={{ padding: 0 }}
                                                    >
                                                        <label
                                                            className="bs-Fieldset-label Text-align--left"
                                                            htmlFor="monitors"
                                                        >
                                                            <span>
                                                                Monitors
                                                            </span>
                                                        </label>
                                                        {formValues &&
                                                            formValues.selectAllMonitors && (
                                                                <div
                                                                    className="bs-Fieldset-row"
                                                                    style={{
                                                                        padding: 0,
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="bs-Fieldset-fields bs-Fieldset-fields--wide"
                                                                        style={{
                                                                            padding: 0,
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="Box-root"
                                                                            style={{
                                                                                height:
                                                                                    '5px',
                                                                            }}
                                                                        ></div>
                                                                        <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--column Flex-justifyContent--flexStart">
                                                                            <label
                                                                                className="Checkbox"
                                                                                htmlFor="selectAllMonitorsBox"
                                                                            >
                                                                                <Field
                                                                                    component="input"
                                                                                    type="checkbox"
                                                                                    name="selectAllMonitors"
                                                                                    className="Checkbox-source"
                                                                                    id="selectAllMonitorsBox"
                                                                                />
                                                                                <div className="Checkbox-box Box-root Margin-top--2 Margin-right--2">
                                                                                    <div className="Checkbox-target Box-root">
                                                                                        <div className="Checkbox-color Box-root"></div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="Checkbox-label Box-root Margin-left--8">
                                                                                    <span className="Text-color--default Text-display--inline Text-fontSize--14 Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                                        <span>
                                                                                            All
                                                                                            Monitors
                                                                                            Selected
                                                                                        </span>
                                                                                    </span>
                                                                                </div>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        {formValues &&
                                                            !formValues.selectAllMonitors && (
                                                                <div className="bs-Fieldset-fields">
                                                                    <div
                                                                        className="bs-Fieldset-field"
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                        }}
                                                                    >
                                                                        <MultiSelectDropDown
                                                                            ready={
                                                                                true
                                                                            }
                                                                            value={`${
                                                                                selectedMonitors.length
                                                                            } Monitor${
                                                                                selectedMonitors.length >
                                                                                0
                                                                                    ? 's'
                                                                                    : ''
                                                                            } Selected`}
                                                                            updateState={
                                                                                this
                                                                                    .updateState
                                                                            }
                                                                            selectedProjects={
                                                                                selectedProjects
                                                                            }
                                                                            selectedComponents={
                                                                                selectedComponents
                                                                            }
                                                                            selectedMonitors={
                                                                                selectedMonitors
                                                                            }
                                                                            options={
                                                                                selectData
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            </fieldset>
                                        )}
                                        <fieldset className="Margin-bottom--16">
                                            <div className="bs-Fieldset-rows">
                                                <div
                                                    className="bs-Fieldset-row"
                                                    style={{ padding: 0 }}
                                                >
                                                    <label
                                                        className="bs-Fieldset-label Text-align--left"
                                                        htmlFor="duration"
                                                    >
                                                        <span>
                                                            Duration (minutes)
                                                        </span>
                                                    </label>
                                                    <div className="bs-Fieldset-fields">
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
                                                                name="duration"
                                                                placeholder="60"
                                                                id="duration"
                                                                className="bs-TextInput"
                                                                style={{
                                                                    width:
                                                                        '100%',
                                                                    padding:
                                                                        '3px 5px',
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>
                                        <fieldset className="Margin-bottom--16">
                                            <div className="bs-Fieldset-rows">
                                                <div
                                                    className="bs-Fieldset-row"
                                                    style={{ padding: 0 }}
                                                >
                                                    <label
                                                        className="bs-Fieldset-label Text-align--left"
                                                        htmlFor="alertTime"
                                                    >
                                                        <span>
                                                            Alert Team before
                                                            SLA is breached.
                                                        </span>
                                                    </label>
                                                    <div className="bs-Fieldset-fields">
                                                        <div
                                                            className="bs-Fieldset-field"
                                                            style={{
                                                                width: '100%',
                                                                flexDirection:
                                                                    'column',
                                                            }}
                                                        >
                                                            <Field
                                                                component={
                                                                    RenderField
                                                                }
                                                                name="alertTime"
                                                                placeholder="60"
                                                                id="alertTime"
                                                                className="bs-TextInput"
                                                                style={{
                                                                    width:
                                                                        '100%',
                                                                    padding:
                                                                        '3px 5px',
                                                                }}
                                                            />
                                                            <p className="bs-Fieldset-explanation">
                                                                <span>
                                                                    Alert X
                                                                    minutes
                                                                    before SLA
                                                                    is breached.
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>
                                        <div className="bs-Fieldset-row">
                                            <label className="bs-Fieldset-label">
                                                <span></span>
                                            </label>
                                            <div className="bs-Fieldset-fields bs-Fieldset-fields--wide">
                                                <div
                                                    className="Box-root"
                                                    style={{
                                                        height: '5px',
                                                    }}
                                                ></div>
                                                <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--column Flex-justifyContent--flexStart">
                                                    <label
                                                        className="Checkbox"
                                                        htmlFor="isDefault"
                                                    >
                                                        <Field
                                                            component="input"
                                                            type="checkbox"
                                                            name="isDefault"
                                                            className="Checkbox-source"
                                                            id="isDefault"
                                                        />
                                                        <div className="Checkbox-box Box-root Margin-top--2 Margin-right--2">
                                                            <div className="Checkbox-target Box-root">
                                                                <div className="Checkbox-color Box-root"></div>
                                                            </div>
                                                        </div>
                                                        <div className="Checkbox-label Box-root Margin-left--8">
                                                            <span className="Text-color--default Text-display--inline Text-fontSize--14 Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                <span>
                                                                    Set as
                                                                    Default
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bs-Modal-footer">
                                    <div className="bs-Modal-footer-actions">
                                        <ShouldRender if={slaError}>
                                            <div
                                                className="bs-Tail-copy"
                                                style={{ width: 200 }}
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
                                                            {slaError}
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
                                                    id: editIncidentSlaModalId,
                                                })
                                            }
                                        >
                                            <span>Cancel</span>
                                            <span className="cancel-btn__keycode">
                                                Esc
                                            </span>
                                        </button>
                                        <button
                                            id="editSlaBtn"
                                            className="bs-Button bs-DeprecatedButton bs-Button--blue btn__modal"
                                            disabled={requesting}
                                            type="submit"
                                        >
                                            {!requesting && (
                                                <>
                                                    <span>Update</span>
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

EditIncidentCommunicationSlaModal.displayName =
    'EditIncidentCommunicationSlaModal';

EditIncidentCommunicationSlaModal.propTypes = {
    closeModal: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    requesting: PropTypes.bool,
    slaError: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    updateCommunicationSla: PropTypes.func,
    currentProject: PropTypes.object,
    initialValues: PropTypes.object,
    editIncidentSlaModalId: PropTypes.string,
    formValues: PropTypes.object,
    monitorsList: PropTypes.array,
    fetchMonitors: PropTypes.func,
};

const EditIncidentSlaForm = reduxForm({
    form: 'editIncidentSlaForm',
    enableReinitialize: false,
    validate,
    destroyOnUnmount: true,
})(EditIncidentCommunicationSlaModal);

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            closeModal,
            updateCommunicationSla,
            fetchMonitors,
        },
        dispatch
    );

const mapStateToProps = state => {
    const incidentSlaToBeUpdated = state.modal.modals[0].sla;
    const projectId = state.modal.modals[0].projectId;

    const initialValues = {};
    if (incidentSlaToBeUpdated) {
        initialValues.name = incidentSlaToBeUpdated.name;
        initialValues.isDefault = incidentSlaToBeUpdated.isDefault;
        initialValues.duration = incidentSlaToBeUpdated.duration;
        initialValues.alertTime = incidentSlaToBeUpdated.alertTime;
        initialValues._id = incidentSlaToBeUpdated._id;
    }

    const monitorData = state.monitor.monitorsList.monitors.find(
        data => String(data._id) === String(projectId)
    );
    const monitors = monitorData ? monitorData.monitors : [];
    if (!initialValues.isDefault) {
        initialValues.monitors = monitors
            .filter(
                monitor =>
                    monitor.incidentCommunicationSla &&
                    String(monitor.incidentCommunicationSla._id) ===
                        String(initialValues._id)
            )
            .map(monitor => monitor._id);
    }

    return {
        editIncidentSlaModalId: state.modal.modals[0].id,
        initialValues,
        formValues:
            state.form.editIncidentSlaForm &&
            state.form.editIncidentSlaForm.values,
        requesting: state.incidentSla.incidentCommunicationSlas.requesting,
        slaError: state.incidentSla.incidentCommunicationSlas.error,
        currentProject: state.project.currentProject,
        monitorsList: monitors,
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EditIncidentSlaForm);
