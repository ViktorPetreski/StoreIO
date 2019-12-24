import axios from "axios"
import moment from 'moment';
import {
    ADD_PRODUCT_FLOW,
    DELETE_PRODUCT,
    GET_ALL_PRODUCTS, GET_PRODUCT_FLOWS,
    GET_CURRENT_STORE_PRODUCTS,
    PUT_PRODUCT,
    UPDATE_PRODUCT, GET_QUANTITIES_FROM_OTHER_STORES, DELETE_PRODUCT_FLOW, GET_PF_BY_INVOICE_NUMBER
} from "./types";
import {tokenConfig} from "./auth";
import {createMessage, returnErrors} from "./messages";


export const getProducts = () => (dispatch, getState) => {
    axios.get('api/store-products/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_CURRENT_STORE_PRODUCTS,
                payload: res.data
            })
        })
        .catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const addProduct = product => (dispatch, getState) => {
    axios.post('/api/store-products/', product, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({manufacturerAdded: `Додаден ${product.description}`}));
            console.log('res data', res.data);
            dispatch({
                type: PUT_PRODUCT,
                payload: res.data
            })
        })
        .catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const deleteProduct = id => (dispatch, getState) => {
    axios.delete(`/api/products/${id}/`, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({productDeleted: "Избришан артикл"}));
            dispatch({
                type: DELETE_PRODUCT,
                payload: id,
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const updateProduct = (id, product) => (dispatch, getState) => {
    axios.put(`/api/products/${id}/`, product, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({productUpdated: `Променет е продуктот ${product.description}`}));
            dispatch({
                type: UPDATE_PRODUCT,
                payload: res.data,
            })
        }).catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};


export const getAllProducts = () => (dispatch, getState) => {
    axios.get(`api/products/`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_ALL_PRODUCTS,
                payload: res.data
            })
        }).catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};


export const addProductFlow = (productFlow) => (dispatch, getState) => {
    axios.post(`api/product-flow/`, productFlow, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({productUpdated: `Извршен е ${productFlow.operation} на артикли`}));
            dispatch({
                type: ADD_PRODUCT_FLOW,
                payload: res.data
            })
        }).catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const getProductFlows = (date, page=1) => (dispatch, getState) => {
    axios.get(`api/product-flow/?date=${date}&page=${page}`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_PRODUCT_FLOWS,
                payload: res.data
            })
        }).catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const removeProductFlow = id => (dispatch, getState) => {
    axios.delete(`api/product-flow/${id}`, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({productDeleted: 'Избришан/а прием/повратница'}));
            dispatch({
                type: DELETE_PRODUCT_FLOW,
                payload: id
            })
        }).catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const searchByInvoiceNumber = invoiceNumber => (dispatch, getState) => {
    axios.get(`/api/product-flow/?invoice=${invoiceNumber}`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_PF_BY_INVOICE_NUMBER,
                payload: res.data
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const getQuantitiesForOtherStores = (productID) => (dispatch, getState) => {
    axios.get(`api/store-products/get_quantities_for_other_stores/?product=${productID}`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_QUANTITIES_FROM_OTHER_STORES,
                payload: res.data
            })
        }).catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

