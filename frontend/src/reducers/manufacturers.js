import {DELETE_MANUFACTURER, GET_MANUFACTURERS, PUT_MANUFACTURER, UPDATE_MANUFACTURER} from "../actions/types";


const initialState = {
    manufacturers: [],
    manufacturerProducts: []
};

export default function (state = initialState, action) {
    switch (action.type) {
        case GET_MANUFACTURERS:
            return {
                ...state,
                manufacturers: action.payload
            };
        case PUT_MANUFACTURER:
            return {
                ...state,
                manufacturers: [...state.manufacturers, action.payload]
            };
        case DELETE_MANUFACTURER:
            return {
                ...state,
                manufacturers: state.manufacturers.filter(m => m.id !== action.payload)
            };
        case UPDATE_MANUFACTURER:
            const index = state.manufacturers.findIndex(manu => manu.id === action.payload.id);
            state.manufacturers[index] = action.payload;
            return {
                ...state,
                manufacturers: [...state.manufacturers],
            };
        default:
            return state;
    }
}
