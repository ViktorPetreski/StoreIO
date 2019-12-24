import axios from "axios";
import {tokenConfig} from "./auth";
import {createMessage, returnErrors} from "./messages";
import {ADD_INVOICE, DELETE_INVOICE, GET_INVOICES, GET_PF_BY_INVOICE_NUMBER} from "./types";

export const getInvoices = () => (dispatch, getState) => {
    axios.get('/api/invoices/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_INVOICES,
                payload: res.data
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const addInvoice = (invoice) => (dispatch, getState) => {
    axios.post('/api/invoices/', invoice, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: ADD_INVOICE,
                payload: res.data
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const deleteInvoice = id => (dispatch, getState) => {
    axios.delete(`/api/invoices/${id}`, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({productDeleted: 'Избришана фактура'}));
            dispatch({
                type: DELETE_INVOICE,
                payload: id,
            });
        }).catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};
