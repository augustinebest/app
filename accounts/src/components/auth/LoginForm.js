import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import { RenderField } from '../basic/RenderField';
import { connect } from 'react-redux';
import { Validate } from '../../config';
import { ButtonSpinner } from '../basic/Loader.js';
import {
    loginError,
    loginSuccess,
    loginUser,
    resetLogin,
    changeLogin,
} from '../../actions/login';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import { removeQuery } from '../../store';

const errorStyle = {
    color: '#c23d4b',
};
export class LoginForm extends Component {
    state = {
        serverResponse: '',
    };

    componentDidMount() {
        const query = queryString.parse(this.props.location.search).status;
        let serverResponse = '';
        if (query === 'already-verified') {
            serverResponse = 'Email already verified. You can now login.';
        } else if (query === 'verified') {
            serverResponse =
                'Thank you for verifying your email. You can now login.';
        }
        this.setState({
            serverResponse,
        });
        removeQuery('status');
    }
    handleClick(data) {
        this.props.changeLogin(data);
    }
    render() {
        const { handleSubmit } = this.props;
        const { serverResponse } = this.state;
        const loginError = this.props.login.error;
        let header;
        if (loginError) {
            header = (
                <span id="loginError" style={errorStyle}>
                    {loginError}
                </span>
            );
        } else if (serverResponse) {
            header = <span>{serverResponse}</span>;
        } else {
            header = <span>Welcome back!</span>;
        }

        return (
            <div id="main-body" className="box css">
                <div className="inner login">
                    <div>
                        <form
                            onSubmit={handleSubmit(this.props.onSubmit)}
                            id="login-form"
                        >
                            <div className="step email-password-step">
                                <h2>{header}</h2>
                                <p className="text">
                                    <span>
                                        <label htmlFor="email">
                                            <span>Email</span>
                                        </label>
                                        <Field
                                            className="error"
                                            component={RenderField}
                                            type="email"
                                            name="email"
                                            id="email"
                                            placeholder="jeff@example.com"
                                            required="required"
                                        />
                                    </span>
                                </p>
                                {this.props.loginMethod === 'standard' ? (
                                    <p className="text">
                                        <span>
                                            <label htmlFor="password">
                                                <span>Password</span>
                                            </label>
                                            <Field
                                                component={RenderField}
                                                type="password"
                                                name="password"
                                                id="password"
                                                placeholder="Your Password"
                                                required="required"
                                            />
                                        </span>
                                    </p>
                                ) : (
                                    ''
                                )}
                                <p className="submit">
                                    <button
                                        type="submit"
                                        className="button blue medium"
                                        id="login-button"
                                        disabled={this.props.login.requesting}
                                    >
                                        {!this.props.login.requesting && (
                                            <span>Sign in</span>
                                        )}
                                        {this.props.login.requesting && (
                                            <ButtonSpinner />
                                        )}
                                    </button>
                                </p>

                                <p className="text">
                                    {this.props.loginMethod === 'standard' ? (
                                        <span
                                            id="sso-login"
                                            className="loginoption"
                                            onClick={() => {
                                                this.handleClick('sso');
                                            }}
                                        >
                                            Log in with SSO
                                        </span>
                                    ) : (
                                        <span
                                            id="standard-login"
                                            className="loginoption"
                                            onClick={() => {
                                                this.handleClick('standard');
                                            }}
                                        >
                                            Log in with password
                                        </span>
                                    )}
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

LoginForm.displayName = 'LoginForm';

const validate = function(values, props) {
    const errors = {};
    if (!Validate.text(values.email)) {
        errors.email = 'Email is required.';
    } else {
        if (!Validate.email(values.email)) {
            errors.email = 'Email is invalid.';
        }
    }

    if (!Validate.text(values.password) && props.loginMethod === 'standard') {
        errors.password = 'Password is required.';
    }

    return errors;
};

const loginForm = reduxForm({
    form: 'LoginForm', // a unique identifier for this form
    validate,
    destroyOnUnmount: true,
})(LoginForm);

const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            loginError,
            loginSuccess,
            loginUser,
            resetLogin,
            changeLogin,
        },
        dispatch
    );
};

function mapStateToProps(state) {
    return {
        login: state.login,
        loginMethod: state.login.loginMethod,
    };
}

LoginForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    login: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    loginMethod: PropTypes.string,
    changeLogin: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(loginForm);
