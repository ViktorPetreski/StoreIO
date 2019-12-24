import {createStore, applyMiddleware} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import thunk from 'redux-thunk'
import rootReducer from './reducers'


const initialState = {};

const middleware = [thunk];

// const appReducer = (state, action) => {
//     if (action.type === 'LOGOUT_SUCCESS') {
//         state = undefined;
//     }
//     if (action.type === 'GET_TOP_SELLING_PRODUCTS_FOR_MONTH_BY_STORE'){
//         const {auth, dashboard} = state;
//         state = {auth, dashboard}
//     }
//     return rootReducer(state, action)
// };

const store = createStore(
    rootReducer,
    initialState,
    composeWithDevTools(applyMiddleware(...middleware))
);

export default store;