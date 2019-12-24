import  {ADD_INSTALMENT, GET_INSTALMENTS} from "../actions/types";

const initialState = {
    instalments: [],
};

export default function (state = initialState, action) {
    let index = -1;
    switch (action.type) {
        case ADD_INSTALMENT:
            index = action.customers.findIndex(cus => cus.id === action.payload['customer'].id);
            action.customers[index] = action.payload['customer'];
            index = action.carts.findIndex(cart => cart.id === action.payload['cart'].id);
            action.carts[index] = action.payload['cart'];
            return {
                ...state,
                instalments: [...state.instalments, action.payload['instalment']]
            };
        case GET_INSTALMENTS:
            return {
                ...state,
                instalments: [...action.payload]
            };
        default:
            return state
    }
}