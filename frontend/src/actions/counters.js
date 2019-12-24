import axios from 'axios'

import {GET_COUNTERS} from "./types";

// get leads

export const getCounters = () => dispatch => {
    console.log('actions-counter');
    axios.get('http://localhost:8000/api/manufacturer/')
        .then(res => {
            dispatch({
                type: GET_COUNTERS,
                payload: res.data
            })
        }).catch(err => console.log(err));
};