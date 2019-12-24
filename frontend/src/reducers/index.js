import {combineReducers} from "redux";
import counters from "./counter"
import manufacturers from "./manufacturers";
import products from "./products";
import errors from "./errors";
import messages from "./messages";
import auth from "./auth";
import warehouses from "./warehouses";
import stores from "./stores";
import cartItem from "./cartItem";
import customers from "./customers";
import instalments from "./instalments";
import alerts from "./alerts";
import invoices from "./invoices";
import dashboard from "./dashboard";
export default combineReducers({
    counters,
    manufacturers,
    products,
    errors,
    messages,
    alerts,
    auth,
    warehouses,
    stores,
    cartItem,
    customers,
    instalments,
    invoices,
    dashboard,
});