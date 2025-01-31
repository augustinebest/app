import { getApi, putApi, deleteApi, postApi } from '../api';
import * as types from '../constants/user';
import errors from '../errors';

export const fetchUsersRequest = () => {
    return {
        type: types.FETCH_USERS_REQUEST,
    };
};

export const fetchUsersSuccess = users => {
    return {
        type: types.FETCH_USERS_SUCCESS,
        payload: users,
    };
};

export const fetchUsersError = error => {
    return {
        type: types.FETCH_USERS_FAILURE,
        payload: error,
    };
};

// Calls the API to fetch all users.
export const fetchUsers = (skip, limit) => async dispatch => {
    skip = skip ? parseInt(skip) : 0;
    limit = limit ? parseInt(limit) : 10;
    dispatch(fetchUsersRequest());

    try {
        const response = await getApi(`user/users?skip=${skip}&limit=${limit}`);
        const data = response.data;

        dispatch(fetchUsersSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(fetchUsersError(errors(errorMsg)));
    }
};

export const fetchUserRequest = () => {
    return {
        type: types.FETCH_USER_REQUEST,
    };
};

export const fetchUserSuccess = user => {
    return {
        type: types.FETCH_USER_SUCCESS,
        payload: user,
    };
};

export const fetchUserError = error => {
    return {
        type: types.FETCH_USER_FAILURE,
        payload: error,
    };
};

// Calls the API to fetch a user.
export const fetchUser = userId => async dispatch => {
    dispatch(fetchUserRequest());

    try {
        const response = await getApi(`user/users/${userId}`);
        const data = response.data;

        dispatch(fetchUserSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(fetchUserError(errors(errorMsg)));
    }
};

// Add user

export const addUserRequest = () => {
    return {
        type: types.ADD_USER_REQUEST,
    };
};

export const addUserSuccess = user => {
    return {
        type: types.ADD_USER_SUCCESS,
        payload: user,
    };
};

export const addUserError = error => {
    return {
        type: types.ADD_USER_FAILURE,
        payload: error,
    };
};

export const resetAddUser = () => {
    return {
        type: types.ADD_USER_RESET,
    };
};

// Calls the API to add user.
export const addUser = user => async dispatch => {
    try {
        dispatch(addUserRequest());
        const response = await postApi(`user/signup`, user);
        const userResponse = await getApi(`user/users/${response.data.id}`);

        dispatch(addUserSuccess(userResponse.data));
        return 'ok';
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(addUserError(errors(errorMsg)));
    }
};

//Update user setting

export const updateUserSettingRequest = () => {
    return {
        type: types.UPDATE_USER_SETTING_REQUEST,
    };
};

export const updateUserSettingSuccess = userSetting => {
    return {
        type: types.UPDATE_USER_SETTING_SUCCESS,
        payload: userSetting,
    };
};

export const updateUserSettingError = error => {
    return {
        type: types.UPDATE_USER_SETTING_FAILURE,
        payload: error,
    };
};

// Calls the API to update user setting.
export const updateUserSetting = values => async dispatch => {
    const data = new FormData();
    if (values.profilePic && values.profilePic[0]) {
        data.append(
            'profilePic',
            values.profilePic[0],
            values.profilePic[0].name
        );
    }

    data.append('name', values.name);
    data.append('email', values.email);
    data.append('companyPhoneNumber', values.companyPhoneNumber);
    data.append('timezone', values.timezone);
    dispatch(updateUserSettingRequest());

    try {
        const response = await putApi(`user/profile/${values._id}`, data);
        const user = response.data;

        dispatch(updateUserSettingSuccess(user));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(updateUserSettingError(errors(errorMsg)));
    }
};

export const logFile = file => {
    return function(dispatch) {
        dispatch({ type: 'LOG_FILE', payload: file });
    };
};

export const resetFile = () => {
    return function(dispatch) {
        dispatch({ type: 'RESET_FILE' });
    };
};

//Delete user
export const deleteUserRequest = () => {
    return {
        type: types.DELETE_USER_REQUEST,
    };
};

export const deleteUserReset = () => {
    return {
        type: types.DELETE_USER_RESET,
    };
};

export const deleteUserSuccess = user => {
    return {
        type: types.DELETE_USER_SUCCESS,
        payload: user,
    };
};

export const deleteUserError = error => {
    return {
        type: types.DELETE_USER_FAILED,
        payload: error,
    };
};

// Calls the API to delete a user.
export const deleteUser = userId => async dispatch => {
    dispatch(deleteUserRequest());

    try {
        const response = await deleteApi(`user/${userId}`);
        const data = response.data;

        dispatch(deleteUserSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(deleteUserError(errors(errorMsg)));
    }
};

//Restore user
export const restoreUserRequest = () => {
    return {
        type: types.RESTORE_USER_REQUEST,
    };
};

export const restoreUserReset = () => {
    return {
        type: types.RESTORE_USER_RESET,
    };
};

export const restoreUserSuccess = user => {
    return {
        type: types.RESTORE_USER_SUCCESS,
        payload: user,
    };
};

export const restoreUserError = error => {
    return {
        type: types.RESTORE_USER_FAILED,
        payload: error,
    };
};

// Calls the API to restore a user
export const restoreUser = userId => async dispatch => {
    dispatch(restoreUserRequest());

    try {
        const response = await putApi(`user/${userId}/restoreUser`);
        const data = response.data;

        dispatch(restoreUserSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(restoreUserError(errors(errorMsg)));
    }
};

//Block user
export const blockUserRequest = () => {
    return {
        type: types.BLOCK_USER_REQUEST,
    };
};

export const blockUserReset = () => {
    return {
        type: types.BLOCK_USER_RESET,
    };
};

export const blockUserSuccess = user => {
    return {
        type: types.BLOCK_USER_SUCCESS,
        payload: user,
    };
};

export const blockUserError = error => {
    return {
        type: types.BLOCK_USER_FAILED,
        payload: error,
    };
};

// Calls the API to restore a user
export const blockUser = userId => async dispatch => {
    dispatch(blockUserRequest());

    try {
        const response = await putApi(`user/${userId}/blockUser`);
        const data = response.data;

        dispatch(blockUserSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(blockUserError(errors(errorMsg)));
    }
};

//Enable Admin Mode
export const enableAdminModeRequest = () => {
    return {
        type: types.ENABLE_ADMIN_MODE_REQUEST,
    };
};

export const enableAdminModeSuccess = user => {
    return {
        type: types.ENABLE_ADMIN_MODE_SUCCESS,
        payload: user,
    };
};

export const enableAdminModeError = error => {
    return {
        type: types.ENABLE_ADMIN_MODE_FAILED,
        payload: error,
    };
};

export const enableAdminModeReset = () => {
    return {
        type: types.ENABLE_ADMIN_MODE_RESET,
    };
};

// Enable admin mode
export const enableAdminMode = (userId, values) => async dispatch => {
    dispatch(enableAdminModeRequest());

    try {
        const response = await postApi(
            `user/${userId}/switchToAdminMode`,
            values
        );
        const data = response.data;

        dispatch(enableAdminModeSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(enableAdminModeError(errors(errorMsg)));
    }
};

//Disable Admin Mode
export const disableAdminModeRequest = () => {
    return {
        type: types.DISABLE_ADMIN_MODE_REQUEST,
    };
};

export const disableAdminModeSuccess = user => {
    return {
        type: types.DISABLE_ADMIN_MODE_SUCCESS,
        payload: user,
    };
};

export const disableAdminModeError = error => {
    return {
        type: types.DISABLE_ADMIN_MODE_FAILED,
        payload: error,
    };
};

export const disableAdminModeReset = () => {
    return {
        type: types.DISABLE_ADMIN_MODE_RESET,
    };
};

// Disable admin mode
export const disableAdminMode = userId => async dispatch => {
    dispatch(disableAdminModeRequest());

    try {
        const response = await postApi(`user/${userId}/exitAdminMode`);
        const data = response.data;

        dispatch(disableAdminModeSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(disableAdminModeError(errors(errorMsg)));
    }
};

//Unblock user
export const unblockUserRequest = () => {
    return {
        type: types.UNBLOCK_USER_REQUEST,
    };
};

export const unblockUserReset = () => {
    return {
        type: types.UNBLOCK_USER_RESET,
    };
};

export const unblockUserSuccess = user => {
    return {
        type: types.UNBLOCK_USER_SUCCESS,
        payload: user,
    };
};

export const unblockUserError = error => {
    return {
        type: types.UNBLOCK_USER_FAILED,
        payload: error,
    };
};

// Calls the API to unblock a user
export const unblockUser = userId => async dispatch => {
    dispatch(unblockUserRequest());

    try {
        const response = await putApi(`user/${userId}/unblockUser`);
        const data = response.data;

        dispatch(unblockUserSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(unblockUserError(errors(errorMsg)));
    }
};

//Add Project Notes
export const addUserNoteRequest = () => {
    return {
        type: types.ADD_USER_NOTE_REQUEST,
    };
};

export const addUserNoteReset = () => {
    return {
        type: types.ADD_USER_NOTE_RESET,
    };
};

export const addUserNoteSuccess = userNote => {
    return {
        type: types.ADD_USER_NOTE_SUCCESS,
        payload: userNote,
    };
};

export const addUserNoteError = error => {
    return {
        type: types.ADD_USER_NOTE_FAILURE,
        payload: error,
    };
};

// Calls the API to add Admin Note
export const addUserNote = (userId, values) => async dispatch => {
    dispatch(addUserNoteRequest());

    try {
        const response = await postApi(`user/${userId}/addNote`, values);
        const data = response.data;

        dispatch(addUserNoteSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(addUserNoteError(errors(errorMsg)));
    }
};

//Search Users
export const searchUsersRequest = () => {
    return {
        type: types.SEARCH_USERS_REQUEST,
    };
};

export const searchUsersReset = () => {
    return {
        type: types.SEARCH_USERS_RESET,
    };
};

export const searchUsersSuccess = users => {
    return {
        type: types.SEARCH_USERS_SUCCESS,
        payload: users,
    };
};

export const searchUsersError = error => {
    return {
        type: types.SEARCH_USERS_FAILURE,
        payload: error,
    };
};

// Calls the search users api
export const searchUsers = (filter, skip, limit) => async dispatch => {
    const values = {
        filter,
    };
    skip = skip ? parseInt(skip) : 0;
    limit = limit ? parseInt(limit) : 10;

    dispatch(searchUsersRequest());

    try {
        const response = await postApi(
            `user/users/search?skip=${skip}&limit=${limit}`,
            values
        );
        const data = response.data;

        dispatch(searchUsersSuccess(data));
        return response;
    } catch (error) {
        let errorMsg;
        if (error && error.response && error.response.data)
            errorMsg = error.response.data;
        if (error && error.data) {
            errorMsg = error.data;
        }
        if (error && error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'Network Error';
        }
        dispatch(searchUsersError(errors(errorMsg)));
    }
};

// Update user twoFactorAuthToken
export function twoFactorAuthTokenRequest() {
    return {
        type: types.UPDATE_TWO_FACTOR_AUTH_REQUEST,
    };
}

export function twoFactorAuthTokenSuccess(payload) {
    return {
        type: types.UPDATE_TWO_FACTOR_AUTH_SUCCESS,
        payload: payload,
    };
}

export function twoFactorAuthTokenError(error) {
    return {
        type: types.UPDATE_TWO_FACTOR_AUTH_FAILURE,
        payload: error,
    };
}

export function updateTwoFactorAuthToken(userId, data) {
    return function(dispatch) {
        const promise = putApi(`user/${userId}/2fa`, data);
        dispatch(twoFactorAuthTokenRequest());
        promise.then(
            function(response) {
                const payload = response.data;
                dispatch(twoFactorAuthTokenSuccess(payload));
                return payload;
            },
            function(error) {
                if (error && error.response && error.response.data)
                    error = error.response.data;
                if (error && error.data) {
                    error = error.data;
                }
                if (error && error.message) {
                    error = error.message;
                } else {
                    error = 'Network Error';
                }
                dispatch(twoFactorAuthTokenError(errors(error)));
            }
        );

        return promise;
    };
}

export function setTwoFactorAuth(enabled) {
    return {
        type: types.SET_TWO_FACTOR_AUTH,
        payload: enabled,
    };
}

//fetching user login history
// Update user twoFactorAuthToken
export function fetchUserHistoryRequest() {
    return {
        type: types.FETCH_USER_LOGIN_HISTORY_REQUEST,
    };
}

export function fetchUserHistorySuccess(payload) {
    return {
        type: types.FETCH_USER_LOGIN_HISTORY_SUCCESS,
        payload: payload,
    };
}

export function fetchUserHistoryError(error) {
    return {
        type: types.FETCH_USER_LOGIN_HISTORY_FAILURE,
        payload: error,
    };
}

export function fetchUserloginHistory(userId, skip, limit = 10) {
    return function(dispatch) {
        const promise = getApi(`history/${userId}?skip=${skip}&limit=${limit}`);
        dispatch(fetchUserHistoryRequest());
        promise.then(
            function(response) {
                const payload = response.data;
                dispatch(fetchUserHistorySuccess(payload));
                return payload;
            },
            function(error) {
                if (error && error.response && error.response.data)
                    error = error.response.data;
                if (error && error.data) {
                    error = error.data;
                }
                if (error && error.message) {
                    error = error.message;
                } else {
                    error = 'Network Error';
                }
                dispatch(fetchUserHistoryError(errors(error)));
            }
        );

        return promise;
    };
}
