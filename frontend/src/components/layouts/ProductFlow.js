import React, {Component} from 'react';
import {connect} from "react-redux";
import * as PropTypes from "prop-types";
import moment from 'moment'
import 'moment/locale/mk';

import {
    Form, Button, Select, InputNumber, Switch, DatePicker, Input,
} from 'antd';
import {addProductFlow, getQuantitiesForOtherStores} from "../../actions/products";
import {getStores} from "../../actions/stores";
import {addInvoice, getInvoices} from "../../actions/invoices";

const Option = Select.Option;

function hasErrors(fieldsError) {
    return Object.keys(fieldsError).some(field => fieldsError[field]);
}

class ProductFlowComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sourceType: 0,
            selectTitle: 'Избери добавувач',
            operationAddition: true,
            isSearching: false,
            searchValue: '',
            keyCode: null,
            manufacturerID: -1,
            availableQuantity: 1000,
        };
    }

    static propTypes = {
        manufacturers: PropTypes.array.isRequired,
        stores: PropTypes.array.isRequired,
        allProducts: PropTypes.array.isRequired,
        otherStoreProductQuantities: PropTypes.array,
        currentUserStoreProducts: PropTypes.array,
        invoices: PropTypes.array.isRequired,
        getStores: PropTypes.func.isRequired,
        addProductFlow: PropTypes.func.isRequired,
        getQuantitiesForOtherStores: PropTypes.func.isRequired,
        addInvoice: PropTypes.func.isRequired,
        getInvoices: PropTypes.func.isRequired,
        storeProductID: PropTypes.number.isRequired,
        productID: PropTypes.number.isRequired,
        currentStore: PropTypes.object.isRequired,
    };

    componentDidMount() {
        this.props.form.validateFields();
        if (this.props.stores.length <= 0) this.props.getStores();
        this.props.getInvoices();
        this.props.getQuantitiesForOtherStores(this.props.productID);
        const manufacturerID = this.props.allProducts.find(p => p.id === this.props.productID).manufacturer;
        this.setState({manufacturerID: manufacturerID})
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const date = values['date-time-picker'].format('YYYY-MM-DD HH:mm:ss');
                const {new_quantity, source, stock_source, operation, invoiceNumber} = values;
                const productFlow = {
                    date,
                    new_quantity,
                    source,
                    stock_source,
                    operation,
                    invoiceNumber,
                    'store_product_id': this.props.storeProductID,
                    'product_id': this.props.productID
                };
                this.props.addProductFlow(productFlow);
            }
        });
    };
    handleSelect = (value, option) => {
        let type = 0;
        let manufacturerID = -1;
        if (value === 'WH') type = 1;
        if (value === 'OEM') {
            type = 0;
            manufacturerID = this.props.allProducts.find(p => p.id === this.props.productID).manufacturer
        }
        if (value === 'CUS') type = 2;
        this.setState({sourceType: type, selectTitle: 'Избери продавница/магацин', manufacturerID: manufacturerID})

    };

    handleOperationSwitch = (value, e) => {
        this.setState({operationAddition: !this.state.operationAddition});
        this.props.form.resetFields(['stock_source',]);
        this.handleSelect('OEM', {})
    };

    handleInvoiceSelect = (value, option) => {
        this.setState({isSearching: false, keyCode: null});
    };

    handleInvoiceSearch = (value) => {
        this.setState({isSearching: true});
    };

    onInputKeyDown = (e) => {
        let {keyCode, target} = e;
        const {isSearching} = this.state;
        if (keyCode === 13 && isSearching) {
            this.setState({keyCode: keyCode, searchValue: target.value});
        }
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {searchValue, isSearching, keyCode, manufacturerID} = this.state;
        if (searchValue !== '' && isSearching && keyCode === 13 && manufacturerID !== -1) {
            this.props.addInvoice({
                'invoice_number': searchValue,
                'manufacturer': manufacturerID
            });
            this.setState({isSearching: false, searchValue: '', keyCode: null})
        }
    }

    changeAvailableQuantity = (value, e) => {
        const {quantity} = e.props;
        if (quantity)
            this.setState({availableQuantity: quantity})
    };

    createInvoicesList = () => {
        const {invoices} = this.props;
        const invoiceList = [];
        for (let invoice of invoices) {
            invoiceList.push(<Option key={invoice.id} value={invoice.id}>{invoice.invoice_number}</Option>)
        }
        return invoiceList;
    };

    render() {
        const {
            getFieldDecorator, getFieldsError,
        } = this.props.form;
        const {
            manufacturers, stores, currentStore, otherStoreProductQuantities, currentUserStoreProducts, storeProductID,
        } = this.props;
        const manufacturerList = [];
        for (let manufacturer of manufacturers) {
            manufacturerList.push(
                <Option key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</Option>);
        }

        const warehouseList = [];
        for (let store of stores) {
            let otherStoreQuantity = otherStoreProductQuantities.find(sp => sp.store === store.id) || null;
            if (!this.state.operationAddition) {
               otherStoreQuantity =  currentUserStoreProducts.find(sp => sp.id === storeProductID)
            }
            if (store.id !== currentStore.id && otherStoreQuantity)
                warehouseList.push(<Option quantity={otherStoreQuantity.available_quantity || 1000} key={store.id}
                                           value={store.id}>{store.location} |
                    Достапно: {otherStoreQuantity.available_quantity}</Option>)
        }

        const initialValue = this.state.sourceType === 0 ? {initialValue: this.state.manufacturerID} : {initialValue: null};
        const selectSource = (
            <Form.Item>
                {getFieldDecorator('source', initialValue)(
                    <Select style={{width: 200}} placeholder={this.state.selectTitle}
                            onSelect={this.changeAvailableQuantity}>
                        {this.state.sourceType === 1 ? warehouseList : manufacturerList}
                    </Select>
                )}
            </Form.Item>
        );
        const now = moment();
        const config = {
            initialValue: now,
            rules: [{type: 'object', required: true, message: 'Внесете дата!'}],
        };

        const invoiceFormItem = (
            <Form.Item help="Внесете само ако е на фактура">
                {getFieldDecorator('invoiceNumber')(
                    <Select placeholder="Број на фактура"
                            showSearch
                            optionFilterProp="children"
                            maxTagCount={5}
                            maxTagPlaceholder="Користи ја опцијата за пребарување за приказ на останатите фактури"
                            filterOption={(input, option) =>
                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            onSelect={this.handleInvoiceSelect}
                            onSearch={this.handleInvoiceSearch}
                            onInputKeyDown={this.onInputKeyDown}
                    >
                        {this.createInvoicesList()}
                    </Select>
                )}
            </Form.Item>
        );
        // Only show error after a field is touched.
        return (
            <Form onSubmit={this.handleSubmit} style={{width: 200, margin: 'auto'}}>
                <Form.Item>
                    {getFieldDecorator('operation', {valuePropName: 'checked', initialValue: true})(
                        <Switch checkedChildren="Прием" unCheckedChildren="Повратница"
                                onChange={this.handleOperationSwitch}/>
                    )}
                </Form.Item>
                <Form.Item>
                    {getFieldDecorator('date-time-picker', config)(
                        <DatePicker placeholder={"Дата"} showTime format="DD MMM YY"/>,
                    )}
                </Form.Item>
                <Form.Item>
                    {getFieldDecorator('stock_source', {
                        rules: [{required: true, message: 'Внесете извор на артиклот'}],
                        initialValue: 'OEM',
                    })(
                        <Select style={{width: 200}} onSelect={this.handleSelect} placeholder={"Потекло"}>
                            <Option value="OEM">Добавувач</Option>
                            <Option value="WH">Продавница/Магацин</Option>
                            {this.state.operationAddition ? <Option value="CUS">Муштерија</Option> : ''}
                        </Select>
                    )}
                </Form.Item>

                {this.state.sourceType !== 2 ? selectSource : ''}

                <Form.Item>
                    {getFieldDecorator('new_quantity', {
                        rules: [{required: true, message: 'Внесете количина'}],
                    })(
                        <InputNumber style={{width: 200}} max={this.state.availableQuantity} autoFocus
                                     placeholder="Количина"/>
                    )}
                </Form.Item>

                {this.state.sourceType === 0 && this.state.operationAddition ? invoiceFormItem : ''}

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        disabled={hasErrors(getFieldsError())}
                    >
                        Додади
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

const ProductFlow = Form.create({name: 'horizontal_login'})(ProductFlowComponent);

const mapStateToProps = state => ({
    manufacturers: state.manufacturers.manufacturers,
    stores: state.stores.stores,
    currentStore: state.stores.currentStore,
    allProducts: state.products.productByID,
    currentUserStoreProducts: state.products.products,
    otherStoreProductQuantities: state.products.otherStoreProductQuantities,
    invoices: state.invoices.invoices
});

export default connect(
    mapStateToProps,
    {
        getStores,
        addProductFlow,
        getQuantitiesForOtherStores,
        getInvoices,
        addInvoice,
    })(ProductFlow);