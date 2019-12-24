import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Button, Divider, Icon, Input, List, Table} from "antd";
import {getAllProducts, getProducts} from "../../actions/products";
import {getCartItemsForCustomer, getCartsForCustomer} from "../../actions/cartItems";
import {getInstalments, payInstalment} from "../../actions/installments";
import * as PropTypes from "prop-types";
import {getStores} from "../../actions/stores";
import moment from "moment";

class CustomerDetails extends Component {

    constructor(props) {
        super(props);
        this.state = {
            instalmentPrice: '',
        }
    }

    static propTypes = {
        storeProducts: PropTypes.array.isRequired,
        getProducts: PropTypes.func.isRequired,
        getAllProducts: PropTypes.func.isRequired,
        getCartItemsForCustomer: PropTypes.func.isRequired,
        getInstalments: PropTypes.func.isRequired,
        getStores: PropTypes.func.isRequired,
        getCartsForCustomer: PropTypes.func.isRequired,
        payInstalment: PropTypes.func.isRequired,
        allProducts: PropTypes.array.isRequired,
        customers: PropTypes.array.isRequired,
        currentUserStoreProducts: PropTypes.array.isRequired,
        instalments: PropTypes.array.isRequired,
        allCarts: PropTypes.array.isRequired,
        allCartItems: PropTypes.array.isRequired,
        stores: PropTypes.array.isRequired,
        customerID: PropTypes.number.isRequired,
    };

    componentDidMount() {
        if (this.props.allProducts.length === 0) this.props.getAllProducts();
        if (this.props.storeProducts.length === 0) this.props.getProducts();
        if (this.props.allCarts.length === 0) this.props.getCartsForCustomer(this.props.customerID);
        this.props.getCartItemsForCustomer(this.props.customerID);
        this.props.getInstalments();
    }

    prepareData = () => {
        const data = [];
        for (let cart of this.props.allCarts) {
            const cartItems = this.props.allCartItems.filter(p => p.sale === cart.id);
            let productString = [];

            for (let cartItem of cartItems) {
                const storeProduct = this.props.storeProducts.find(p => p.id === cartItem.product);
                const product = this.props.allProducts.find(p => p.id === storeProduct.product);
                const price = cartItem.combined_price / cartItem.bought_quantity;
                productString.push(`${cartItem.bought_quantity} x ${price} ден. =
                    ${cartItem.combined_price} ден. - ${product.description} | во ${storeProduct.store}`);
            }
            const preparedData = {
                'key': cart.id,
                'date': cart.date_sold,
                'product': <List size={"small"} dataSource={productString}
                                 renderItem={item => <List.Item>{item}</List.Item>}/>,
                'paid_sum': cart.paid_sum,
                'isPaid': cart.is_paid,

            };
            data.push(preparedData);
        }
        return data.reverse();
    };

    handlePriceChange = (e) => {
        const {value} = e.target;
        const fullPrice = this.props.customers.find(c => c.id === this.props.customerID).owes;
        if (value === 'q') {
            this.setState({instalmentPrice: fullPrice});
            return;
        }
        this.setState({instalmentPrice: value})
    };
    onPressEnter = (e) => {
        const instalment = {
            'customer': this.props.customerID,
            'amount_paid': this.state.instalmentPrice,
            'paid_on': moment(),
        };
        this.props.payInstalment(instalment);
    };

    render() {
        const data = this.prepareData();
        const columns = [{
            title: 'Дата',
            dataIndex: 'date',
            render: (text) => <span>{moment(text).format('DD MMM YY HH:mm')}</span>
        }, {
            title: 'Купени производи',
            dataIndex: 'product',
        }, {
            title: 'Платена сума',
            dataIndex: 'paid_sum',
            render: (text) => (text + ' ден.')
        },{
            title: 'Платена',
            align: 'center',
            dataIndex: 'isPaid',
            render: (text) => (text ?
                <Icon style={{fontSize: '25px'}} type="check-circle" theme="twoTone" twoToneColor={"#42f486"}/> :
                <Icon twoToneColor={"#ff5323"} type="close-circle" style={{fontSize: '25px'}} theme="twoTone"/>)
        }];
        const customer = this.props.customers.find(p => p.id === this.props.customerID);
        return (
            <div>
                <Table columns={columns} dataSource={data} size="middle" style={{width: 600}} pagination={{ defaultPageSize:5 }}/>
                <Divider dashed/>
                <div>
                    <h4>Должи: {customer.owes} ден.</h4>
                    <Input disabled={customer.owes <= 0} max={customer.owes} autoFocus style={{width: 300}} placeholder={"Сума која ја плаќа"}
                           onChange={this.handlePriceChange}
                           onPressEnter={this.onPressEnter}
                           addonAfter={<Button type={"link"} disabled={customer.owes <= 0} onClick={this.onPressEnter}>Плати</Button>}
                           value={this.state.instalmentPrice}/>
                </div>

            </div>
        );
    }
}

const mapStateToProps = state => ({
    storeProducts: state.products.products,
    allProducts: state.products.productByID,
    currentUserStoreProducts: state.products.currentUserStoreProducts,
    instalments: state.instalments.instalments,
    allCartItems: state.cartItem.cartItemsForCustomer,
    allCarts: state.cartItem.cartsForCustomer,
    stores: state.stores.stores,
    customers: state.customers.customers,
});

export default connect(
    mapStateToProps,
    {
        getCartsForCustomer,
        getProducts,
        getAllProducts,
        getInstalments,
        getCartItemsForCustomer,
        getStores,
        payInstalment
    }
)(CustomerDetails);
