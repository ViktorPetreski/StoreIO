import {ADD_INVOICE, DELETE_INVOICE, GET_INVOICES} from "../actions/types";

const initialState = {
    invoices: [],
};

export default function (state = initialState, action) {
    switch (action.type) {
        case GET_INVOICES:
            return {
                ...state,
                invoices: action.payload
            };
        case ADD_INVOICE:
            return {
                ...state,
                invoices: [...state.invoices, action.payload]
            };
        case DELETE_INVOICE:
            return {
                ...state,
                invoices: state.invoices.filter(m => m.id !== action.payload)
            };
        default:
            return state;
    }
}