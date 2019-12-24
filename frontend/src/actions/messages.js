import {CREATE_MESSAGE, GET_ERRORS, INSPECTION_ALERT} from "./types";

//Create message
export const createMessage = (message) => {
    return {
        type: CREATE_MESSAGE,
        payload: message
    }
};

//Return error
export const returnErrors = (message, status) => {
    return {
        type: GET_ERRORS, payload: {message, status}
    };
};

export const inspectionAlert = (message) => {
    return {
        type: INSPECTION_ALERT,
        payload: message,
    }
};