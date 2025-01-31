import { getApi, postApi, deleteApi } from '../api';
import * as types from '../constants/smsLogs';
import errors from '../errors';

// Fetch All Sms Logs
export const fetchSmsLogsRequest = () => {
    return {
        type: types.FETCH_SMSLOGS_REQUEST,
    };
};

export const fetchSmsLogsSuccess = smsLogs => {
    return {
        type: types.FETCH_SMSLOGS_SUCCESS,
        payload: smsLogs,
    };
};

export const fetchSmsLogsError = error => {
    return {
        type: types.FETCH_SMSLOGS_FAILURE,
        payload: error,
    };
};

export const fetchSmsLogs = (skip, limit) => async dispatch => {
    skip = skip ? parseInt(skip) : 0;
    limit = limit ? parseInt(limit) : 10;

    dispatch(fetchSmsLogsRequest());

    try {
        const response = await getApi(`sms-logs?skip=${skip}&limit=${limit}`);
        const data = response.data;

        dispatch(fetchSmsLogsSuccess(data));

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
        dispatch(fetchSmsLogsError(errors(errorMsg)));
    }
};

// Search Sms Logs.
export const searchSmsLogsRequest = () => {
    return {
        type: types.SEARCH_SMSLOGS_REQUEST,
    };
};

export const searchSmsLogsSuccess = smsLogs => {
    return {
        type: types.SEARCH_SMSLOGS_SUCCESS,
        payload: smsLogs,
    };
};

export const searchSmsLogsError = error => {
    return {
        type: types.SEARCH_SMSLOGS_FAILURE,
        payload: error,
    };
};

export const searchSmsLogs = (filter, skip, limit) => async dispatch => {
    const values = {
        filter,
    };

    dispatch(searchSmsLogsRequest());

    try {
        const response = await postApi(
            `sms-logs/search?skip=${skip}&limit=${limit}`,
            values
        );
        const data = response.data;

        dispatch(searchSmsLogsSuccess(data));
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
        dispatch(searchSmsLogsError(errors(errorMsg)));
    }
};

// Delete All Sms Logs
export const deleteSmsLogsRequest = () => {
    return {
        type: types.DELETE_ALL_SMSLOGS_REQUEST,
    };
};

export const deleteSmsLogsSuccess = message => {
    return {
        type: types.DELETE_ALL_SMSLOGS_SUCCESS,
        payload: message,
    };
};

export const deleteSmsLogsError = error => {
    return {
        type: types.DELETE_ALL_SMSLOGS_FAILURE,
        payload: error,
    };
};

export const deleteSmsLogs = () => async dispatch => {
    dispatch(deleteSmsLogsRequest());

    try {
        const response = await deleteApi(`sms-logs`);
        const message = response.data.message;

        dispatch(deleteSmsLogsSuccess(message));
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
        dispatch(deleteSmsLogsError(errors(errorMsg)));
    }
};

// fetch smsLogStatus

export function fetchSmsLogStatusRequest(promise) {
    return {
        type: types.FETCH_SMSLOG_STATUS_REQUEST,
        payload: promise,
    };
}

export function fetchSmsLogStatusError(error) {
    return {
        type: types.FETCH_SMSLOG_STATUS_FAILED,
        payload: error,
    };
}

export function fetchSmsLogStatusSuccess(smsLogStatus) {
    return {
        type: types.FETCH_SMSLOG_STATUS_SUCCESS,
        payload: smsLogStatus,
    };
}

export const resetFetchSmsLogStatus = () => {
    return {
        type: types.FETCH_SMSLOG_STATUS_RESET,
    };
};

// Calls the API to fetch smsLogStatus
export const fetchSmsLogStatus = () => async dispatch => {
    dispatch(fetchSmsLogStatusRequest());

    try {
        const response = await getApi('globalConfig/smsLogMonitoringStatus');
        dispatch(fetchSmsLogStatusSuccess(response.data));
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
        dispatch(fetchSmsLogStatusError(errors(errorMsg)));
        return 'error';
    }
};

// change smsLogStatus

export function changeSmsLogStatusRequest(promise) {
    return {
        type: types.CHANGE_SMSLOG_STATUS_REQUEST,
        payload: promise,
    };
}

export function changeSmsLogStatusError(error) {
    return {
        type: types.CHANGE_SMSLOG_STATUS_FAILED,
        payload: error,
    };
}

export function changeSmsLogStatusSuccess(smsLogStatus) {
    return {
        type: types.CHANGE_SMSLOG_STATUS_SUCCESS,
        payload: smsLogStatus,
    };
}

export const resetConfirmSmsLogStatus = () => {
    return {
        type: types.CHANGE_SMSLOG_STATUS_RESET,
    };
};

// Calls the API to change smsLogStatus
export const smsLogStatusChange = values => async dispatch => {
    dispatch(changeSmsLogStatusRequest());

    try {
        const response = await postApi('globalConfig/', [
            { name: 'smsLogMonitoringStatus', value: values.status },
        ]);
        const data = response.data;
        dispatch(changeSmsLogStatusSuccess(data));
        return data;
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
        dispatch(changeSmsLogStatusError(errors(errorMsg)));
        return 'error';
    }
};
