import {ADD_STORE, GET_CURRENT_STORE, GET_STORES} from "../actions/types";

const initialState = {
    stores: [],
    currentStore: {},
};

export default function (state = initialState, action){
    switch (action.type) {
        case ADD_STORE:
            return {
                ...state,
                stores: [...state.stores, action.payload]
            };
        case GET_STORES:
            return {
                ...state,
                stores: action.payload['all_stores'],
                currentStore: action.payload['current_store'],
            };
        case GET_CURRENT_STORE:
            return{
                ...state,
                currentStore: action.payload,
            };
        default:
            return state;
    }
};
