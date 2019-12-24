import {
    ADD_CART_ITEM, DELETE_CART,
    DELETE_CART_ITEM, GET_CART_ITEMS_FOR_CUSTOMER, GET_CART_ITEMS_FOR_DAY, GET_CARTS_FOR_CUSTOMER, GET_CARTS_FOR_DAY,
    GET_CURRENT_CART,
    GET_CURRENT_CART_ITEMS,
    UPDATE_CART,
    UPDATE_CART_ITEM
} from "../actions/types";

const initialState = {
    cartItems: [],
    products: [],
    cart: null,
    cartItemsForCustomer: [],
    cartsForCustomer: [],
    totalSum: 0,
    cashSum:0,
    registeredSum:0,
    paginationCount: 0,
    spin: true,
};

export default function (state = initialState, action) {
    let index = null;
    switch (action.type) {
        case ADD_CART_ITEM:
            index = action.products.currentUserStoreProducts.findIndex(product => product.id === action.payload['store_product'].id);
            action.products.currentUserStoreProducts[index] = action.payload['store_product'];
            const indexCI = state.cartItems.findIndex(cartItem => cartItem.id === action.payload['cartItem'].id);
            if (indexCI >= 0){
                state.cartItems[indexCI] = action.payload['cartItem'];
                return {
                    ...state,
                    cartItems: [...state.cartItems],
                    cart: action.payload['cart'],
                }
            }
            return {
                ...state,
                cartItems: [...state.cartItems, action.payload['cartItem']],
                cartItemsForCustomer: [...state.cartItemsForCustomer, action.payload['cartItem']],
                cart: action.payload['cart'],
            };
        case GET_CURRENT_CART_ITEMS:
            return {
                ...state,
                cartItems: action.payload
            };
        case GET_CART_ITEMS_FOR_CUSTOMER:
        case GET_CART_ITEMS_FOR_DAY:
            return{
                ...state,
                cartItemsForCustomer: action.payload
            };
        case UPDATE_CART_ITEM:
            const cartItem = action.payload['cart_item'];
            const cart = action.payload['cart'];
            const ciIndex = state.cartItems.findIndex(ci => ci.id === cartItem.id);
            index = state.cartItemsForCustomer.findIndex(ci=>ci.id === cartItem.id);
            state.cartItems[ciIndex] = cartItem;
            state.cartItemsForCustomer[index] = cartItem;
            if (cart) {
                index = state.cartsForCustomer.findIndex(c => c.id === cart.id);
                state.cartsForCustomer[index] = cart
            }
            return {
                ...state,
                cartItems: [...state.cartItems],
                cartItemsForCustomer: [...state.cartItemsForCustomer],
                cartsForCustomer: [...state.cartsForCustomer],
            };
        case DELETE_CART_ITEM:
            index = action.currentUserStoreProducts.findIndex(product => product.id === action.payload.id);
            action.currentUserStoreProducts[index] = action.payload;
            return{
                ...state,
                cartItems: state.cartItems.filter(ci => ci.id !== action.id)
            };
        case GET_CURRENT_CART:
            return {
                ...state,
                cart: action.payload
            };
        case GET_CARTS_FOR_CUSTOMER:
            return {
                ...state,
                cartsForCustomer: [...action.payload],
            };
        case GET_CARTS_FOR_DAY:
            return{
                ...state,
                cartsForCustomer: [...action.payload['results']],
                totalSum: action.payload['total_sum'],
                cashSum: action.payload['cash_sum'],
                registeredSum: action.payload['registered_sum'],
                paginationCount: action.payload['count'],
                spin: action.spin,
            };
        case UPDATE_CART:
            return{
                ...state,
                cart: action.payload,
                cartItems: []
            };
        case DELETE_CART:
            return {
                ...state,
                cartsForCustomer: state.cartsForCustomer.filter(cart => cart.id !== action.payload),
            };
        default:
            return state;
    }
}