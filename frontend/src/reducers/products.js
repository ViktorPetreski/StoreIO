import {
    ADD_PRODUCT_FLOW,
    GET_ALL_PRODUCTS,
    GET_PRODUCT_FLOWS,
    GET_CURRENT_STORE_PRODUCTS,
    UPDATE_PRODUCT,
    GET_QUANTITIES_FROM_OTHER_STORES, DELETE_PRODUCT_FLOW, GET_PF_BY_INVOICE_NUMBER
} from "../actions/types";
import {PUT_PRODUCT} from "../actions/types";
import {DELETE_PRODUCT} from "../actions/types";


const initialState = {
    products: [],
    productByID: [],
    currentUserStoreProducts: [],
    otherStoreProductQuantities: [],
    flows: [],
    paginationCount: 0,
};

export default function (state = initialState, action) {
    let index = -1;
    switch (action.type) {
        case GET_CURRENT_STORE_PRODUCTS:
            return {
                ...state,
                products: action.payload['allStoreProducts'],
                currentUserStoreProducts: action.payload['currentStoreProducts'],
            };
        case GET_ALL_PRODUCTS:
            return {
                ...state,
                productByID: action.payload,
            };
        case PUT_PRODUCT:
            if (action.payload['mainProduct']) {
                return {
                    ...state,
                    products: [...state.products, action.payload['storeProduct']],
                    productByID: [...state.productByID, action.payload['mainProduct']],
                    currentUserStoreProducts: [...state.currentUserStoreProducts, action.payload['storeProduct']]
                };
            } else {
                return {
                    ...state,
                    products: [...state.products, action.payload['storeProduct']],
                    currentUserStoreProducts: [...state.currentUserStoreProducts, action.payload['storeProduct']]
                };
            }
        case DELETE_PRODUCT:
            return {
                ...state,
                productByID: state.productByID.filter(m => m.id !== action.payload),
                currentUserStoreProducts: state.currentUserStoreProducts.filter(sp => sp.product !== action.payload),
                products: state.products.filter(sp => sp.product !== action.payload),
            };
        case UPDATE_PRODUCT:
            index = state.productByID.findIndex(product => product.id === action.payload.id);
            state.productByID[index] = action.payload;
            return {
                ...state,
                productByID: [...state.productByID]
            };
        case ADD_PRODUCT_FLOW:
            if(action.payload['source_store_product']) {
                index = state.products.findIndex(p => p.id === action.payload['source_store_product'].id);
                state.products[index] = action.payload['source_store_product'];
            }
            index = state.currentUserStoreProducts.findIndex(p => p.id === action.payload['restocked_store_product'].id);
            state.currentUserStoreProducts[index] = action.payload['restocked_store_product'];
            return {
                ...state,
                products: [...state.products],
                currentUserStoreProducts: [...state.currentUserStoreProducts],
                flows: [...state.flows, action.payload['product_flow']]
            };
        case GET_PRODUCT_FLOWS:
            return {
                ...state,
                flows: [...action.payload['results']],
                paginationCount: action.payload['count'],
            };
        case DELETE_PRODUCT_FLOW:
            return{
                ...state,
                flows: state.flows.filter(pf => pf.key !== action.payload)
            };
        case GET_PF_BY_INVOICE_NUMBER:
            return {
                ...state,
                flows: [...action.payload['results']],
                paginationCount: action.payload['count']
            };
        case GET_QUANTITIES_FROM_OTHER_STORES:
            return {
                ...state,
                otherStoreProductQuantities: [...action.payload],
            };
        default:
            return state;
    }
}
