import {
    GET_ANNUAL_APPROXIMATE_INCOME,
    GET_PRODUCT_ADDITION_BY_MONTH,
    GET_SALES_FREQUENCY_BY_MONTH,
    GET_TOP_SELLING_PRODUCTS_FOR_MONTH_BY_STORE, GET_WEEKLY_INCOME
} from "../actions/types";

const initialState = {
    topSellingProductsByMonthByStore: {},
    salesFrequencyByMonthByStore: {},
    revenue: {},
    highestRevenueProductsByMonth: {},
    productAdditionFrequencyByMonthByStore: {},
    annualSaleAndProdFlowData: {},
};

export default function (state = initialState, action) {
    switch (action.type) {
        case GET_TOP_SELLING_PRODUCTS_FOR_MONTH_BY_STORE:
            return {
                ...state,
                topSellingProductsByMonthByStore: {...action.payload['data']},
                revenue: {...action.payload['revenue']},
                highestRevenueProductsByMonth: {...action.payload['highest_revenue_products']}
            };
        case GET_SALES_FREQUENCY_BY_MONTH:
            return {
                ...state,
                salesFrequencyByMonthByStore: {...action.payload}
            };
        case GET_PRODUCT_ADDITION_BY_MONTH:
            return {
                ...state,
                productAdditionFrequencyByMonthByStore: {...action.payload}
            };
        case GET_WEEKLY_INCOME:
        case GET_ANNUAL_APPROXIMATE_INCOME:
            return {
                ...state,
                annualSaleAndProdFlowData: {...action.payload},
            };
        default:
            return state;
    }
};