import axios from "axios"

import {tokenConfig} from "./auth";
import {createMessage, returnErrors} from "./messages";
import {ADD_CUSTOMER, GET_CUSTOMERS} from "./types";

export const addCustomer = (customer) => (dispatch, getState) => {
    axios.post('api/customers/', customer, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({cartItemAdded: `Додадени е муштерија ${customer.name}`}));
            dispatch({
                type: ADD_CUSTOMER,
                payload: res.data
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const getCustomers = () => (dispatch, getState) => {
    axios.get('api/customers/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_CUSTOMERS,
                payload: res.data
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};