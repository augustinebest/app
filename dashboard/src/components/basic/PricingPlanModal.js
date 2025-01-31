import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';
import { PricingPlan, Validate } from '../../config';
import { FormLoader } from './Loader';
import ShouldRender from './ShouldRender';
import { changePlan } from '../../actions/project';
import { closeModal } from '../../actions/modal';
import { SHOULD_LOG_ANALYTICS } from '../../config';
import { logEvent } from '../../analytics';
import RadioInput from '../project/RadioInput';

function validate(values) {
    const errors = {};

    if (!Validate.text(values.planId)) {
        errors.name = 'Stripe PlanID is required!';
    }

    return errors;
}

class PricingPlanModal extends Component {
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyboard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyboard);
    }

    handleKeyboard = e => {
        switch (e.key) {
            case 'Escape':
                return this.props.closeThisDialog();
            case 'Enter':
                return document.getElementById('confirmPlanUpgrade').click();
            default:
                break;
        }
    };

    handleFormSubmit = values => {
        const {
            closeModal,
            currentProject,
            currentPlanId,
            modalId,
            changePlan,
            error,
        } = this.props;
        const { _id: id, name } = currentProject;
        const {
            category: oldCategory,
            type: oldType,
            details: oldDetails,
        } = PricingPlan.getPlanById(currentPlanId);
        const oldPlan = `${oldCategory} ${oldType}ly (${oldDetails})`;
        const {
            category: newCategory,
            type: newType,
            details: newDetails,
        } = PricingPlan.getPlanById(values.planId);

        const newPlan = `${newCategory} ${newType}ly (${newDetails})`;

        changePlan(id, values.planId, name, oldPlan, newPlan).then(() => {
            if (SHOULD_LOG_ANALYTICS) {
                logEvent('EVENT: DAHBOARD > PROJECT PLAN CHANGED', {
                    oldPlan,
                    newPlan,
                });
            }

            if (!error) {
                return closeModal({
                    id: modalId,
                });
            }
        });
    };

    render() {
        const {
            closeThisDialog,
            propArr,
            handleSubmit,
            isRequesting,
            error,
            activePlan,
        } = this.props;

        const plans = PricingPlan.getPlans();
        return (
            <div
                className="ModalLayer-wash Box-root Flex-flex Flex-alignItems--flexStart Flex-justifyContent--center"
                id="pricingPlanModal"
            >
                <div
                    className="ModalLayer-contents"
                    tabIndex={-1}
                    style={{ marginTop: 40 }}
                >
                    <div className="bs-BIM">
                        <div className="bs-Modal bs-Modal--medium">
                            <form
                                onSubmit={handleSubmit(this.handleFormSubmit)}
                            >
                                <div className="bs-Modal-header">
                                    <div className="bs-Modal-header-copy">
                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                            <span>Upgrade Plan</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="bs-Modal-content">
                                    {propArr[0].plan === 'Enterprise' ? (
                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--regular Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                            This feature is available on
                                            Enterprise Plan. To upgrade to this
                                            plan, please contact
                                            sales@oneuptime.com
                                        </span>
                                    ) : (
                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--regular Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                            This feature is available on{' '}
                                            <strong>
                                                {propArr[0].plan} plan and
                                                above.
                                            </strong>{' '}
                                            Please upgrade your plan to access
                                            this feature.
                                        </span>
                                    )}
                                </div>
                                <ShouldRender
                                    if={propArr[0].plan !== 'Enterprise'}
                                >
                                    <div
                                        className="bs-Modal-content"
                                        style={{ padding: 0 }}
                                    >
                                        <fieldset
                                            className="bs-Fieldset"
                                            style={{ padding: 0 }}
                                        >
                                            <div className="bs-Fieldset-rows">
                                                <div className="price-list-2c Margin-all--16">
                                                    {plans.map(plan => (
                                                        <label
                                                            key={plan.planId}
                                                            htmlFor={`${plan.category}_${plan.type}`}
                                                            style={{
                                                                cursor:
                                                                    'pointer',
                                                            }}
                                                        >
                                                            <div
                                                                className={`bs-Fieldset-fields Flex-justifyContent--center price-list-item Box-background--white ${
                                                                    activePlan ===
                                                                    plan.planId
                                                                        ? 'price-list-item--active'
                                                                        : ''
                                                                }`}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: 0,
                                                                }}
                                                            >
                                                                <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                                                    <span
                                                                        style={{
                                                                            marginBottom:
                                                                                '4px',
                                                                        }}
                                                                    >
                                                                        {
                                                                            plan.category
                                                                        }{' '}
                                                                        {plan.type ===
                                                                        'month'
                                                                            ? 'Monthly'
                                                                            : 'Yearly'}{' '}
                                                                        Plan
                                                                    </span>
                                                                </span>
                                                                <RadioInput
                                                                    id={`${plan.category}_${plan.type}`}
                                                                    details={
                                                                        plan.details
                                                                    }
                                                                    value={
                                                                        plan.planId
                                                                    }
                                                                    style={{
                                                                        display:
                                                                            'flex',
                                                                        alignItems:
                                                                            'center',
                                                                        justifyContent:
                                                                            'center',
                                                                        color:
                                                                            '#4c4c4c',
                                                                    }}
                                                                />
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </fieldset>
                                    </div>
                                </ShouldRender>
                                <ShouldRender if={error}>
                                    <div className="Box-background--white">
                                        <div
                                            className="Padding-all--20"
                                            style={{ color: 'red' }}
                                        >
                                            {error}
                                        </div>
                                    </div>
                                </ShouldRender>
                                <div className="bs-Modal-footer">
                                    <div className="bs-Modal-footer-actions">
                                        <button
                                            id="cancelPlanUpgrade"
                                            className={`bs-Button btn__modal ${isRequesting &&
                                                'bs-is-disabled'}`}
                                            type="button"
                                            onClick={e => {
                                                e.preventDefault();
                                                closeThisDialog();
                                            }}
                                        >
                                            <span>Cancel</span>
                                            <span className="cancel-btn__keycode">
                                                Esc
                                            </span>
                                        </button>
                                        {propArr[0].plan === 'Enterprise' ? (
                                            <a
                                                id="enterpriseMail"
                                                className={`bs-Button bs-Button--blue`}
                                                href="mailto:sales@oneuptime.com"
                                                autoFocus={true}
                                            >
                                                Contact Sales
                                            </a>
                                        ) : (
                                            <button
                                                id="confirmPlanUpgrade"
                                                className={`bs-Button bs-Button--blue btn__modal`}
                                                type="submit"
                                                autoFocus={true}
                                            >
                                                <ShouldRender
                                                    if={!isRequesting}
                                                >
                                                    <span>Upgrade</span>
                                                    <span className="create-btn__keycode">
                                                        <span className="keycode__icon keycode__icon--enter" />
                                                    </span>
                                                </ShouldRender>
                                                <ShouldRender if={isRequesting}>
                                                    <FormLoader />
                                                </ShouldRender>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

PricingPlanModal.displayName = 'Pricing Plan Modal';

PricingPlanModal.propTypes = {
    closeThisDialog: PropTypes.func,
    propArr: PropTypes.array,
    handleSubmit: PropTypes.func,
    isRequesting: PropTypes.bool,
    error: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    closeModal: PropTypes.func,
    currentProject: PropTypes.object,
    currentPlanId: PropTypes.string,
    modalId: PropTypes.string,
    changePlan: PropTypes.func,
    activePlan: PropTypes.string,
};

const mapStateToProps = state => {
    const currentPlanId =
        state.project &&
        state.project.currentProject &&
        state.project.currentProject.stripePlanId
            ? state.project.currentProject.stripePlanId
            : '';

    return {
        initialValues: {
            // initial values for the redux form
            planId: currentPlanId,
        },
        isRequesting: state.project.changePlan.requesting,
        error: state.project.changePlan.error,
        currentProject: state.project.currentProject,
        currentPlanId,
        modalId: state.modal.modals[0].id,
        activePlan:
            state.form.PricingForm && state.form.PricingForm.values.planId,
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators({ closeModal, changePlan }, dispatch);

const PricingForm = new reduxForm({
    form: 'PricingForm',
    validate,
    enableReinitialize: true,
})(PricingPlanModal);

export default connect(mapStateToProps, mapDispatchToProps)(PricingForm);
