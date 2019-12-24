import axios from "axios"
import {tokenConfig} from "./auth";
import {createMessage, returnErrors} from "./messages";
import {ADD_STORE, GET_CURRENT_STORE, GET_STORES} from "./types";

export const addStore = store => (dispatch, getState) => {
    axios.post("api/stores/", store, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({storeAdded: `Додадена е продавница во ${store.location}`}));
            dispatch({
                type: ADD_STORE,
                payload: res.data,
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const getStores = () => (dispatch, getState) => {
    axios.get("/api/stores/", tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_STORES,
                payload: res.data
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

//todo fix input number on product page
//todo implement search
//todo fix delete invoice
export const getCurrentStore = () => (dispatch, getState) => {
    axios.get("/api/stores/get_current_store/", tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_CURRENT_STORE,
                payload: res.data
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};
