import axios from "axios"

import {tokenConfig} from "./auth";
import {createMessage, returnErrors} from "./messages";
import {
    ADD_CART_ITEM, DELETE_CART,
    DELETE_CART_ITEM,
    GET_CART_ITEMS_FOR_CUSTOMER, GET_CART_ITEMS_FOR_DAY, GET_CARTS_FOR_CUSTOMER, GET_CARTS_FOR_DAY,
    GET_CURRENT_CART,
    GET_CURRENT_CART_ITEMS,
    UPDATE_CART,
    UPDATE_CART_ITEM
} from "./types";

export const getCartItems = () => (dispatch, getState) => {
    axios.get('api/cart-items/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_CURRENT_CART_ITEMS,
                payload: res.data
            })
        })
        .catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const getCartItemsForCustomer = (customerID) => (dispatch, getState) => {
    axios.get(`api/cart-items/?customer=${customerID}`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_CART_ITEMS_FOR_CUSTOMER,
                payload: res.data
            })
        })
        .catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const getCartItemsForDay = (day,store) => (dispatch, getState) => {
    axios.get(`api/cart-items/?day=${day}&store=${store}`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_CART_ITEMS_FOR_DAY,
                payload: res.data
            })
        })
        .catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const addCartItem = (cartItem) => (dispatch, getState) => {
    axios.post('api/cart-items/', cartItem, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({cartItemAdded: `Додадени се ${cartItem.bought_quantity} артикли`}));
            dispatch({
                type: ADD_CART_ITEM,
                payload: res.data,
                products: getState().products
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const updateCartItem = (id,cartItem) => (dispatch, getState) => {
    axios.patch(`api/cart-items/${id}/`, cartItem, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: UPDATE_CART_ITEM,
                payload: res.data
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const deleteCartItem = id => (dispatch, getState) => {
    axios.delete(`api/cart-items/${id}/`, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({productDeleted: "Избришан е артикл од кошничката"}));
            dispatch({
                type: DELETE_CART_ITEM,
                id: id,
                payload: res.data,
                currentUserStoreProducts: getState().products.currentUserStoreProducts,
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const getCart = () => (dispatch, getState) => {
    axios.get('api/checkout/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_CURRENT_CART,
                payload: res.data
            })
        })
        .catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const getCartsForCustomer = (customerID) => (dispatch, getState) => {
    axios.get(`api/checkout/?customer=${customerID}`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_CARTS_FOR_CUSTOMER,
                payload: res.data
            })
        })
        .catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const getCartsForDay = (day, store, page=1) => (dispatch, getState) => {
    axios.get(`api/checkout/?day=${day}&page=${page}&store=${store}`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_CARTS_FOR_DAY,
                payload: res.data,
                spin: false,
            })
        })
        .catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};


export const updateCart = (id, cart) => (dispatch, getState) => {
    axios.patch(`api/checkout/${id}/`, cart, tokenConfig(getState))
        .then(res => {
             dispatch(createMessage({productDeleted: "Платено!"}));
            dispatch({
                type: UPDATE_CART,
                payload: res.data
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const deleteCart = (id) => (dispatch, getState) => {
    axios.delete(`api/checkout/${id}/`, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({productDeleted: "Сметката е избришана"}));
            dispatch({
                type: DELETE_CART,
                payload: id,
            })
        })
};