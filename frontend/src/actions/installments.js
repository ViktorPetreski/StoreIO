import axios from "axios"

import {tokenConfig} from "./auth";
import {ADD_INSTALMENT, GET_INSTALMENTS} from "./types";
import {returnErrors} from "./messages";

export const getInstalments = () => (dispatch, getState) => {
    axios.get('api/instalments/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_INSTALMENTS,
                payload: res.data
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const payInstalment = instalment => (dispatch, getState) => {
    axios.post('api/instalments/', instalment, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: ADD_INSTALMENT,
                payload: res.data,
                customers: getState().customers.customers,
                carts: getState().cartItem.cartsForCustomer,
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};