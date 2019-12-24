import {GET_WAREHOUSES} from "../actions/types";

const initialState = {
    warehouses: []
};

export default function (state = initialState, action) {
    switch (action.type) {
        case GET_WAREHOUSES:
             return {
                ...state,
                warehouses: action.payload
            };
        default:
            return state;
    }
}