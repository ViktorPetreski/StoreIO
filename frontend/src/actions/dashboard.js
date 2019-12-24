import axios from 'axios'
import {tokenConfig} from "./auth";
import {
    GET_ANNUAL_APPROXIMATE_INCOME,
    GET_PRODUCT_ADDITION_BY_MONTH,
    GET_SALES_FREQUENCY_BY_MONTH,
    GET_TOP_SELLING_PRODUCTS_FOR_MONTH_BY_STORE, GET_WEEKLY_INCOME
} from "./types";
import {createMessage, returnErrors} from "./messages";

export const getTopSellingProductsByMonth = () => (dispatch, getState) => {
    axios.get('api/dashboard/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_TOP_SELLING_PRODUCTS_FOR_MONTH_BY_STORE,
                payload: res.data,
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
} ;

export const getSalesFrequencyByMonth = () => (dispatch, getState) => {
    axios.get('api/dashboard/sales-frequency/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_SALES_FREQUENCY_BY_MONTH,
                payload: res.data,
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
} ;

export const getProductAdditionFrequencyByMonth = () => (dispatch, getState) => {
    axios.get('api/dashboard/product-flows-frequency/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_PRODUCT_ADDITION_BY_MONTH,
                payload: res.data,
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
} ;
export const getApproximateIncome = (half=null) => (dispatch, getState) => {
    axios.get(`api/dashboard/annual-income/?half=${half}`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_ANNUAL_APPROXIMATE_INCOME,
                payload: res.data,
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
} ;

export const getWeeklyIncome = (start,end) => (dispatch, getState) => {
    axios.get(`api/dashboard/annual-income/?start=${start}&end=${end}`, tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_WEEKLY_INCOME,
                payload: res.data,
            })
        }).catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
} ;