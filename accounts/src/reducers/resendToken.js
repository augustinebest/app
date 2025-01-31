import {
    RESENDTOKEN_FAILED,
    RESENDTOKEN_REQUEST,
    RESENDTOKEN_SUCCESS,
    RESENDTOKEN_RESET,
} from '../constants/resendToken';

const initialState = {
    requesting: false,
    error: null,
    success: false,
};

export default function register(state = initialState, action) {
    switch (action.type) {
        case RESENDTOKEN_REQUEST:
            return Object.assign({}, state, {
                ...state,
                requesting: true,
            });
        case RESENDTOKEN_SUCCESS:
            return Object.assign({}, state, {
                requesting: false,
                success: true,
                error: null,
            });
        case RESENDTOKEN_FAILED:
            return Object.assign({}, state, {
                requesting: false,
                success: false,
                error: action.payload,
            });
        case RESENDTOKEN_RESET:
            return Object.assign({}, state, {
                requesting: false,
                success: false,
                error: null,
            });
        default:
            return state;
    }
}
