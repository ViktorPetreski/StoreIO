import {GET_COUNTERS} from "../actions/types";

const initialState = {
    counters: []
};

export default function (state = initialState, action) {
    switch (action.type) {
        case GET_COUNTERS:
            console.log('reducer-counter');
            return{
                ...state,
                counters: action.payload
            }; 
        default:
            return state;
    }
}

