import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { reduxForm, Field, FieldArray } from 'redux-form';
import { RenderField } from '../basic/RenderField';
import { FormLoader } from '../basic/Loader';
import ShouldRender from '../basic/ShouldRender';
import { ValidateField } from '../../config';
import {
    updateAutomatedScript,
    resetScripts,
    fetchAutomatedScript,
    fetchSingleAutomatedScript,
} from '../../actions/automatedScript';
import { RenderSelect } from '../basic/RenderSelect';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-github';
import DropDownMenu from '../basic/DropDownMenu';

const defaultScript =
    '// To inspect your script or add comments, use console.log\n\n' +
    'async function (done) {\n' +
    '   // write any javascript here \n' +
    '   done();\n' +
    '}\n';
class UpdateScript extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            type: props.details.scriptType,
            script: props.details.script,
            successEventError: null,
            failureEventError: null,
        };
    }

    componentDidMount() {
        const projectId = this.props.activeProject;
        if (projectId) {
            this.props.fetchAutomatedScript(projectId, 0, 10);
        }
        this.props.resetScripts();
    }

    setAutomatedScript = value => {
        this.setState({ ...this.state, script: value });
    };

    submit = values => {
        this.setState({
            successEventError: null,
            failureEventError: null,
        });

        const successEvent = values.successEvent.filter(data => data);
        const failureEvent = values.failureEvent.filter(data => data);
        values.successEvent = successEvent;
        values.failureEvent = failureEvent;
        const successEventIds = successEvent.map(data => data.resource);
        const isSuccessDuplicate = values.successEvent
            ? values.successEvent.length === new Set(successEventIds).size
                ? false
                : true
            : false;

        if (isSuccessDuplicate) {
            this.setState({
                successEventError: 'Duplicate resources selection found',
            });
            return;
        }

        const failureEventIds = failureEvent.map(data => data.resource);
        const isFailureDuplicate = values.failureEvent
            ? values.failureEvent.length === new Set(failureEventIds).size
                ? false
                : true
            : false;

        if (isFailureDuplicate) {
            this.setState({
                failureEventError: 'Duplicate resources selection found',
            });
            return;
        }

        const { type, script } = this.state;
        const {
            activeProject,
            details: { _id, slug },
        } = this.props;
        const automatedScriptId = _id;
        const payload = { ...values, scriptType: type, script };
        this.props
            .updateAutomatedScript(activeProject, automatedScriptId, payload)
            .then(() => {
                this.props.fetchSingleAutomatedScript(
                    activeProject,
                    slug,
                    0,
                    10
                );
            });
    };

    renderSuccessEvent = ({ fields }) => {
        const { script, schedules, successEventValues } = this.props;
        const currentScript = this.props.details._id;
        const scheduleOption =
            schedules && schedules.length > 0
                ? schedules.map(schedule => ({
                      value: schedule._id,
                      label: schedule.name,
                  }))
                : [];
        const scriptOption =
            script && script.length > 0
                ? script
                      .filter(s => s._id !== currentScript)
                      .map(s => ({
                          value: s._id,
                          label: s.name,
                      }))
                : [];
        if (fields.length === 0) {
            fields.push();
        }
        return (
            <>
                {fields.map((field, index) => {
                    const optionObj =
                        successEventValues &&
                        successEventValues[index] &&
                        successEventValues[index].type === 'callSchedule'
                            ? scheduleOption
                            : successEventValues &&
                              successEventValues[index] &&
                              successEventValues[index].type ===
                                  'automatedScript'
                            ? scriptOption
                            : [];

                    return (
                        <div className="bs-a-script" key={index}>
                            <div className="bs-as-pad-10">
                                {index === 0 && (
                                    <div className="bs-as-tag">Type</div>
                                )}
                                <Field
                                    className="db-select-nw Table-cell--width--maximized bs-script-select"
                                    component={RenderSelect}
                                    name={`${field}.type`}
                                    id={`script_${index}`}
                                    placeholder="Automation script"
                                    style={{
                                        height: '28px',
                                        width: '100%',
                                    }}
                                    validate={
                                        successEventValues &&
                                        successEventValues[0] &&
                                        (successEventValues[0].type ||
                                            successEventValues[0].resource) &&
                                        ValidateField.select
                                    }
                                    options={[
                                        {
                                            value: '',
                                            label: 'None',
                                        },
                                        {
                                            value: 'automatedScript',
                                            label: 'Automated Script',
                                        },
                                    ]}
                                />
                            </div>
                            <div className="bs-as-pad-10">
                                {index === 0 && (
                                    <div className="bs-as-tag">Resource</div>
                                )}
                                <Field
                                    className="db-select-nw Table-cell--width--maximized bs-script-select"
                                    component={RenderSelect}
                                    name={`${field}.resource`}
                                    id={`script_${index}`}
                                    placeholder="Automation script"
                                    style={{
                                        height: '28px',
                                        width: '100%',
                                    }}
                                    validate={
                                        successEventValues &&
                                        successEventValues[0] &&
                                        (successEventValues[0].type ||
                                            successEventValues[0].resource) &&
                                        ValidateField.select
                                    }
                                    options={[
                                        {
                                            value: '',
                                            label: 'None',
                                        },
                                        ...optionObj,
                                    ]}
                                />
                            </div>
                            <div
                                className="Box-root Flex-flex Flex-alignItems--center bs-script-btn"
                                style={{ marginBottom: index === 0 && '-27px' }}
                            >
                                <button
                                    className="bs-Button bs-DeprecatedButton"
                                    style={{
                                        borderRadius: '50%',
                                        padding: '0 6px',
                                    }}
                                    onClick={() => {
                                        fields.push();
                                    }}
                                    type="button"
                                >
                                    <img
                                        src="/dashboard/assets/img/plus.svg"
                                        style={{
                                            height: '10px',
                                            width: '10px',
                                        }}
                                        alt=""
                                    />
                                </button>
                                <button
                                    className="bs-Button bs-DeprecatedButton"
                                    style={{
                                        borderRadius: '50%',
                                        padding: '0 6px',
                                    }}
                                    onClick={() => {
                                        fields.remove(index);
                                    }}
                                >
                                    <img
                                        src="/dashboard/assets/img/minus.svg"
                                        style={{
                                            height: '10px',
                                            width: '10px',
                                        }}
                                        alt=""
                                    />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    renderFailureEvent = ({ fields }) => {
        const { script, schedules, failureEventValues } = this.props;
        const currentScript = this.props.details._id;
        const scheduleOption =
            schedules && schedules.length > 0
                ? schedules.map(schedule => ({
                      value: schedule._id,
                      label: schedule.name,
                  }))
                : [];
        const scriptOption =
            script && script.length > 0
                ? script
                      .filter(s => s._id !== currentScript)
                      .map(s => ({
                          value: s._id,
                          label: s.name,
                      }))
                : [];
        if (fields.length === 0) {
            fields.push();
        }
        return (
            <>
                {fields.map((field, index) => {
                    const optionObj =
                        failureEventValues &&
                        failureEventValues[index] &&
                        failureEventValues[index].type === 'callSchedule'
                            ? scheduleOption
                            : failureEventValues &&
                              failureEventValues[index] &&
                              failureEventValues[index].type ===
                                  'automatedScript'
                            ? scriptOption
                            : [];

                    return (
                        <div className="bs-a-script" key={index}>
                            <div className="bs-as-pad-10">
                                {index === 0 && (
                                    <div className="bs-as-tag">Type</div>
                                )}
                                <Field
                                    className="db-select-nw Table-cell--width--maximized bs-script-select"
                                    component={RenderSelect}
                                    name={`${field}.type`}
                                    id={`script_${index}`}
                                    placeholder="Automation script"
                                    style={{
                                        height: '28px',
                                        width: '100%',
                                    }}
                                    validate={
                                        failureEventValues &&
                                        failureEventValues[0] &&
                                        (failureEventValues[0].type ||
                                            failureEventValues[0].resource) &&
                                        ValidateField.select
                                    }
                                    options={[
                                        {
                                            value: '',
                                            label: 'None',
                                        },
                                        {
                                            value: 'automatedScript',
                                            label: 'Automated Script',
                                        },
                                    ]}
                                />
                            </div>
                            <div className="bs-as-pad-10">
                                {index === 0 && (
                                    <div className="bs-as-tag">Resource</div>
                                )}
                                <Field
                                    className="db-select-nw Table-cell--width--maximized bs-script-select"
                                    component={RenderSelect}
                                    name={`${field}.resource`}
                                    id={`script_${index}`}
                                    placeholder="Automation script"
                                    style={{
                                        height: '28px',
                                        width: '100%',
                                    }}
                                    validate={
                                        failureEventValues &&
                                        failureEventValues[0] &&
                                        (failureEventValues[0].type ||
                                            failureEventValues[0].resource) &&
                                        ValidateField.select
                                    }
                                    options={[
                                        {
                                            value: '',
                                            label: 'None',
                                        },
                                        ...optionObj,
                                    ]}
                                />
                            </div>
                            <div
                                className="Box-root Flex-flex Flex-alignItems--center bs-script-btn"
                                style={{ marginBottom: index === 0 && '-27px' }}
                            >
                                <button
                                    className="bs-Button bs-DeprecatedButton"
                                    style={{
                                        borderRadius: '50%',
                                        padding: '0 6px',
                                    }}
                                    onClick={() => {
                                        fields.push();
                                    }}
                                    type="button"
                                >
                                    <img
                                        src="/dashboard/assets/img/plus.svg"
                                        style={{
                                            height: '10px',
                                            width: '10px',
                                        }}
                                        alt=""
                                    />
                                </button>
                                <button
                                    className="bs-Button bs-DeprecatedButton"
                                    style={{
                                        borderRadius: '50%',
                                        padding: '0 6px',
                                    }}
                                    onClick={() => {
                                        fields.remove(index);
                                    }}
                                >
                                    <img
                                        src="/dashboard/assets/img/minus.svg"
                                        style={{
                                            height: '10px',
                                            width: '10px',
                                        }}
                                        alt=""
                                    />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    render() {
        const { addScriptsError, requesting } = this.props;

        return (
            <div className="Box-root Margin-bottom--12">
                <div className="bs-ContentSection Card-root Card-shadow--medium">
                    <div className="Box-root">
                        <div className="bs-ContentSection-content Box-root Box-divider--surface-bottom-1 Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                            <div className="Box-root">
                                <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                    <span>
                                        <ShouldRender if={true}>
                                            <span>Update Script</span>
                                        </ShouldRender>
                                    </span>
                                </span>
                                <div>
                                    Edit existing script which can be triggered
                                    by a user, incident or another script.
                                </div>
                            </div>
                        </div>

                        <form
                            id="form-new-component"
                            onSubmit={this.props.handleSubmit(this.submit)}
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
                                                            name="name"
                                                            id="name"
                                                            placeholder="Script Name"
                                                            disabled={false}
                                                            validate={
                                                                ValidateField.text
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bs-Fieldset-rows">
                                                <div className="bs-Fieldset-row">
                                                    <label className="bs-Fieldset-label">
                                                        Script Type
                                                    </label>
                                                    <div className="bs-Fieldset-fields">
                                                        <DropDownMenu
                                                            options={[
                                                                {
                                                                    value:
                                                                        'JavaScript',
                                                                    show: true,
                                                                },
                                                                {
                                                                    value:
                                                                        'Bash',
                                                                    show: true,
                                                                },
                                                            ]}
                                                            value={
                                                                this.state.type
                                                            }
                                                            updateState={val =>
                                                                this.setState({
                                                                    type: val,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bs-Fieldset-rows">
                                                <div className="bs-Fieldset-row">
                                                    <label className="bs-Fieldset-label">
                                                        Script
                                                    </label>
                                                    <div className="bs-Fieldset-fields">
                                                        {this.state.type ===
                                                            'JavaScript' && (
                                                            <AceEditor
                                                                placeholder="Enter script here"
                                                                mode="javascript"
                                                                theme="github"
                                                                value={
                                                                    this.state
                                                                        .script
                                                                }
                                                                defaultValue={
                                                                    defaultScript
                                                                }
                                                                style={{
                                                                    backgroundColor:
                                                                        '#fff',
                                                                    borderRadius:
                                                                        '4px',
                                                                    boxShadow:
                                                                        '0 0 0 1px rgba(50, 50, 93, 0.16), 0 0 0 1px rgba(50, 151, 211, 0), 0 0 0 2px rgba(50, 151, 211, 0), 0 1px 1px rgba(0, 0, 0, 0.08)',
                                                                }}
                                                                name={`automated-script`}
                                                                id="automatedScript"
                                                                editorProps={{
                                                                    $blockScrolling: true,
                                                                }}
                                                                setOptions={{
                                                                    enableBasicAutocompletion: true,
                                                                    enableLiveAutocompletion: true,
                                                                    enableSnippets: true,
                                                                    showGutter: false,
                                                                }}
                                                                height="150px"
                                                                highlightActiveLine={
                                                                    true
                                                                }
                                                                onChange={
                                                                    this
                                                                        .setAutomatedScript
                                                                }
                                                                fontSize="14px"
                                                                wrapEnabled={
                                                                    true
                                                                }
                                                            />
                                                        )}
                                                        {this.state.type ===
                                                            'Bash' && (
                                                            <AceEditor
                                                                placeholder="echo Hello World"
                                                                mode="javascript"
                                                                theme="github"
                                                                value={
                                                                    this.state
                                                                        .script
                                                                }
                                                                defaultValue={
                                                                    ''
                                                                }
                                                                style={{
                                                                    backgroundColor:
                                                                        '#fff',
                                                                    borderRadius:
                                                                        '4px',
                                                                    boxShadow:
                                                                        '0 0 0 1px rgba(50, 50, 93, 0.16), 0 0 0 1px rgba(50, 151, 211, 0), 0 0 0 2px rgba(50, 151, 211, 0), 0 1px 1px rgba(0, 0, 0, 0.08)',
                                                                }}
                                                                name={`automated-script`}
                                                                id="automatedScript"
                                                                editorProps={{
                                                                    $blockScrolling: true,
                                                                }}
                                                                setOptions={{
                                                                    enableBasicAutocompletion: true,
                                                                    enableLiveAutocompletion: true,
                                                                    enableSnippets: true,
                                                                    showGutter: false,
                                                                }}
                                                                height="150px"
                                                                highlightActiveLine={
                                                                    true
                                                                }
                                                                onChange={
                                                                    this
                                                                        .setAutomatedScript
                                                                }
                                                                fontSize="14px"
                                                                wrapEnabled={
                                                                    true
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>
                                    </div>
                                </div>
                            </div>
                            <div className="bs-ContentSection-content Box-root Box-divider--surface-bottom-1 Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                                <div className="Box-root">
                                    <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                        <span>
                                            <ShouldRender if={true}>
                                                <span>Success Event</span>
                                            </ShouldRender>
                                        </span>
                                    </span>
                                    <div>
                                        This events runs when the script is
                                        successful.
                                    </div>
                                </div>
                            </div>
                            <div
                                className="bs-ContentSection-content Box-root Box-background--offset Box-divider--surface-bottom-1 Padding-vertical--2"
                                style={{ boxShadow: 'none' }}
                            >
                                <div>
                                    <div
                                        className="bs-Fieldset-wrapper Box-root Margin-bottom--2"
                                        style={{ padding: '30px' }}
                                    >
                                        <FieldArray
                                            name="successEvent"
                                            component={this.renderSuccessEvent}
                                        />
                                        <ShouldRender
                                            if={this.state.successEventError}
                                        >
                                            <div
                                                className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                                                style={{
                                                    marginTop: '5px',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <div
                                                    className="Box-root Margin-right--8"
                                                    style={{ marginTop: '2px' }}
                                                >
                                                    <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                                </div>
                                                <div className="Box-root">
                                                    <span
                                                        id="monitorError"
                                                        style={{ color: 'red' }}
                                                    >
                                                        {
                                                            this.state
                                                                .successEventError
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </ShouldRender>
                                    </div>
                                </div>
                            </div>
                            <div className="bs-ContentSection-content Box-root Box-divider--surface-bottom-1 Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                                <div className="Box-root">
                                    <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                        <span>
                                            <ShouldRender if={true}>
                                                <span>Failure Event</span>
                                            </ShouldRender>
                                        </span>
                                    </span>
                                    <div>
                                        This events runs when the script fails.
                                    </div>
                                </div>
                            </div>
                            <div
                                className="bs-ContentSection-content Box-root Box-background--offset Box-divider--surface-bottom-1 Padding-vertical--2"
                                style={{ boxShadow: 'none' }}
                            >
                                <div>
                                    <div
                                        className="bs-Fieldset-wrapper Box-root Margin-bottom--2"
                                        style={{ padding: '30px' }}
                                    >
                                        <FieldArray
                                            name="failureEvent"
                                            component={this.renderFailureEvent}
                                        />
                                        <ShouldRender
                                            if={this.state.failureEventError}
                                        >
                                            <div
                                                className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                                                style={{
                                                    marginTop: '5px',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <div
                                                    className="Box-root Margin-right--8"
                                                    style={{ marginTop: '2px' }}
                                                >
                                                    <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                                </div>
                                                <div className="Box-root">
                                                    <span
                                                        id="monitorError"
                                                        style={{ color: 'red' }}
                                                    >
                                                        {
                                                            this.state
                                                                .failureEventError
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </ShouldRender>
                                    </div>
                                </div>
                            </div>
                            <div className="bs-ContentSection-footer bs-ContentSection-content Box-root Box-background--white Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--12">
                                <div
                                    className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                                    style={{
                                        marginTop: '5px',
                                        alignItems: 'center',
                                    }}
                                >
                                    {addScriptsError && (
                                        <>
                                            <div
                                                className="Box-root Margin-right--8"
                                                style={{ marginTop: '2px' }}
                                            >
                                                <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                            </div>
                                            <div className="Box-root">
                                                <span
                                                    id="monitorError"
                                                    style={{ color: 'red' }}
                                                >
                                                    {addScriptsError &&
                                                        addScriptsError}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <button
                                        id="addComponentButton"
                                        className="bs-Button bs-Button--blue"
                                        disabled={false}
                                        type="submit"
                                    >
                                        <ShouldRender if={!requesting}>
                                            <span>Update Script</span>
                                        </ShouldRender>
                                        <ShouldRender if={requesting}>
                                            <FormLoader />
                                        </ShouldRender>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

UpdateScript.displayName = 'UpdateScript';

const UpdateScriptForm = new reduxForm({
    form: 'newScript',
    destroyOnUnmount: true,
    enableReinitialize: true,
})(UpdateScript);

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            updateAutomatedScript,
            resetScripts,
            fetchAutomatedScript,
            fetchSingleAutomatedScript,
        },
        dispatch
    );

const mapStateToProps = (state, ownProps) => {
    const schedules = [];
    state.schedule.subProjectSchedules.forEach(elem => {
        elem.schedules.forEach(schedule => {
            schedules.push(schedule);
        });
    });

    const initialValues = {};
    initialValues.name = ownProps?.details?.name;
    initialValues.script = ownProps?.details?.script;
    initialValues.successEvent = ownProps?.details?.successEvent;
    initialValues.failureEvent = ownProps?.details?.failureEvent;
    return {
        activeProject: state.subProject.activeSubProject,
        addScriptsError: state.automatedScripts.addScripts.error,
        requesting: state.automatedScripts.addScripts.requesting,
        script: state.automatedScripts.fetchScripts.scripts,
        successEventValues:
            state.form &&
            state.form.newScript &&
            state.form.newScript.values &&
            state.form.newScript.values.successEvent,
        failureEventValues:
            state.form &&
            state.form.newScript &&
            state.form.newScript.values &&
            state.form.newScript.values.failureEvent,
        schedules,
        initialValues,
    };
};

UpdateScript.propTypes = {
    updateAutomatedScript: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    addScriptsError: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    requesting: PropTypes.bool,
    resetScripts: PropTypes.func,
    script: PropTypes.array,
    fetchAutomatedScript: PropTypes.func,
    schedules: PropTypes.array,
    successEventValues: PropTypes.array,
    failureEventValues: PropTypes.array,
    details: PropTypes.object,
    fetchSingleAutomatedScript: PropTypes.func,
    activeProject: PropTypes.string,
};

export default connect(mapStateToProps, mapDispatchToProps)(UpdateScriptForm);
