import axios from "axios"
import {DELETE_MANUFACTURER, GET_MANUFACTURERS, PUT_MANUFACTURER, UPDATE_MANUFACTURER} from "./types";
import {createMessage, returnErrors} from "./messages";
import {tokenConfig} from "./auth";

export const getManufacturers = () => (dispatch, getState) => {
    axios.get('/api/manufacturer/', tokenConfig(getState))
        .then(res => {
            dispatch({
                type: GET_MANUFACTURERS,
                payload: res.data
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const putManufacturer = manufacturer => (dispatch, getState) => {
    axios.post('/api/manufacturer/', manufacturer, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({manufacturerAdded: `Додаден ${manufacturer.name} како добавувач`}));
            dispatch({
                type: PUT_MANUFACTURER,
                payload: res.data
            })
        })
        .catch(err =>
            dispatch(returnErrors(err.response.data, err.response.status))
        );
};

export const deleteManufacturer = (id) => (dispatch, getState) => {
    axios.delete(`/api/manufacturer/${id}/`, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({manufacturerDeleted: 'Избришан добавувач'}));
            dispatch({
                type: DELETE_MANUFACTURER,
                payload: id
            })
        })
        .catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

export const updateManufacturer = (id, manufacturer) => (dispatch, getState) => {
    axios.patch(`/api/manufacturer/${id}/`, manufacturer, tokenConfig(getState))
        .then(res => {
            dispatch(createMessage({manufacturerAdded: 'Извршена промена на име на добавувач'}));
            dispatch({
                type: UPDATE_MANUFACTURER,
                payload: res.data
            });
        }).catch(err => dispatch(returnErrors(err.response.data, err.response.status)));
};

