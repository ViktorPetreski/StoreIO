import {ADD_CUSTOMER, GET_CUSTOMERS} from "../actions/types";

const initialState = {
    customers: [],
};

export default function (state = initialState, action) {
    switch (action.type) {
        case ADD_CUSTOMER:
            return {
                ...state,
                customers: [...state.customers, action.payload]
            };
        case GET_CUSTOMERS:
            return {
                ...state,
                customers: [...action.payload]
            };
        default:
            return state
    }
}