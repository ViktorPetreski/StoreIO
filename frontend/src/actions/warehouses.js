import axios from "axios";
import {tokenConfig} from "./auth";
import {GET_WAREHOUSES} from "./types";
import {returnErrors} from "./messages";

export const getWarehouses = () => (dispatch, getState) => {
    axios.get('/api/stores?warehouses=true', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_WAREHOUSES,
                payload: res.data
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};