import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Button, Checkbox, Divider, Icon, InputNumber, Select, Table, Typography} from "antd";
import PropTypes from 'prop-types';
import {deleteCartItem, getCart, updateCart, updateCartItem} from "../../actions/cartItems";
import {addCustomer, getCustomers} from "../../actions/customers";

const {Title} = Typography;

class Cart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            totalSum: 0,
            discountInput: 0,
            customerCart: false,
            bankCart: false,
            customer: null,
            dataSource: [],
             isSearching: false,
            searchValue: '',
            keyCode: null,
        };
    }

    static propTypes = {
        cartItems: PropTypes.array.isRequired,
        allProducts: PropTypes.array.isRequired,
        storeProducts: PropTypes.array.isRequired,
        customers: PropTypes.array.isRequired,
        cart: PropTypes.object,
        getCart: PropTypes.func.isRequired,
        updateCartItem: PropTypes.func.isRequired,
        getCustomers: PropTypes.func.isRequired,
        deleteCartItem: PropTypes.func.isRequired,
        updateCart: PropTypes.func.isRequired,
        addCustomer: PropTypes.func.isRequired,
    };

    prepareProducts = () => {
        const items = this.props.cartItems;
        const data = [];
        items.forEach(item => {
            const storeProduct = this.props.storeProducts.find(p => p.id === item.product);
            const product = this.props.allProducts.find(p => p.id === storeProduct.product);
            const preparedData = {
                'key': storeProduct.id,
                'id': item.id,
                'description': product.description,
                'bought_quantity': item.bought_quantity,
                'price': product.discounted_price ? product.discounted_price : product.regular_price,
                'total_price': item.combined_price,
                'available_quantity': storeProduct.available_quantity,
            };
            data.push(preparedData)
        });
        return data;
    };

    componentDidMount() {
        this.props.getCustomers();
        this.calculateTotalSum();
        this.props.getCart();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.cartItems.length !== prevProps.cartItems.length) {
            this.calculateTotalSum();
        }
        for (let el of this.props.cartItems) {
            const prevCount = prevProps.cartItems.find(t => t.id === el.id);
            if(prevCount && el.bought_quantity !== prevCount.bought_quantity) {
                this.calculateTotalSum();
                break;
            }
        }

        const {searchValue, isSearching, keyCode} = this.state;
        if (searchValue !== '' && isSearching && keyCode === 13) {
            this.props.addCustomer({'name': searchValue});
            this.setState({isSearching: false, searchValue: '', keyCode: null})
        }
    }

    calculateTotalSum() {
        const items = this.props.cartItems;
        let total = 0;
        items.forEach(cartItem => total += cartItem.combined_price);
        this.setState({totalSum: total});
    }


    handleQuantityChange = (value, record) => {
        const updatedCartItem = {
            'id': record.id,
            'bought_quantity': value,
            'store_product': record.key,
        };
        const difference = value - record['bought_quantity'];
        const val = record['price'] * difference;
        this.setState({totalSum: this.state.totalSum + val});
        this.props.updateCartItem(record.id, updatedCartItem);
    };

    handleDiscountChange = (value) => {
        const difference = value - this.state.discountInput;
        const totalSum = this.state.totalSum;
        const discount = difference / 100;
        let priceWithDiscount = difference < 0 ? Math.round(totalSum / (1 + discount)) : Math.round(totalSum * (1 - discount));
        this.setState({discountInput: value, totalSum: priceWithDiscount});
    };

    handleCustomerCart = (e) => {
        this.setState({customerCart: !this.state.customerCart, bankCart:false});
    };

    handleBankCart = (e) => {
        this.setState({bankCart: !this.state.bankCart, customerCart:false});
    };

    handleDelete = (row) => {
        this.setState({totalSum: this.state.totalSum - row.total_price});
        this.props.deleteCartItem(row.id);
    };

    handleSelectCustomer = (value, option) => {
        this.setState({customer: value, isSearching: false, keyCode: null})
    };

    handleCustomerSearch = (value) => {
        this.setState({isSearching: true});
    };

    onInputKeyDown = (e) => {
        let {keyCode, target} = e;
        const {isSearching} = this.state;
        if (keyCode === 13 && isSearching) {
            this.setState({keyCode: keyCode, searchValue: target.value});
        }
    };

    handleSubmit = () => {
        const cart = {
            'discount': this.state.discountInput,
            'customer': this.state.customer,
            'registered': this.state.bankCart,
            'total_sum': this.state.totalSum
        };
        this.props.updateCart(this.props.cart.id, cart);
    };

    render() {
        const columns = [{
            title: 'Избриши',
            key: 'action',
            render: (text, record) =>
                <Icon type="minus-circle" style={{fontSize: 20}} twoToneColor="#ff4242" theme="twoTone"
                      onClick={() => this.handleDelete(record)}/>
            ,
        }, {
            title: 'Опис на продукт',
            dataIndex: 'description',
            key: 'description',
        }, {
            title: 'Количина во кошничка',
            dataIndex: 'bought_quantity',
            key: 'bought_quantity',
            render: (text, record) => <InputNumber value={text} max={record.available_quantity}
                                                   onChange={(value) => this.handleQuantityChange(value, record)}/>
        }, {
            title: 'Поединечна цена',
            dataIndex: 'price',
            key: 'price',
        }, {
            title: 'Вкупна цена',
            dataIndex: 'total_price',
            key: 'total_price',
        }];

        let customerList = [];
        this.props.customers.forEach(customer => customerList.push(<Select.Option
            value={customer.id} key={customer.id}>{customer.name}</Select.Option>));
        const customerSelect = (
            <Select showSearch
                    placeholder="Одбери муштерија"
                    optionFilterProp="children" style={{width: 200}}
                    filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    autoFocus
                    onSelect={this.handleSelectCustomer}
                    onSearch={this.handleCustomerSearch}
                    onInputKeyDown={this.onInputKeyDown}
            >
                {customerList}
            </Select>
        );
        const data = this.prepareProducts();
        return (
            <div>
                <Table columns={columns} dataSource={data} pagination={false} style={{width: 800}}
                       size={"small"}/>
                <Divider dashed/>
                <div className={"row"}>
                    <div className={"col-md-7"}>
                        <Checkbox onChange={this.handleBankCart} disabled={this.state.customerCart} value={this.state.bankCart}>На фискална?</Checkbox>
                        <Checkbox onChange={this.handleCustomerCart} disabled={this.state.bankCart} value={this.state.customerCart}>На пишанка?</Checkbox>
                        {this.state.customerCart ? customerSelect : ''}
                    </div>
                    <div style={{lineHeight: '40px'}} className={"col-md-5"}>
                        <span>Попуст на цела сметка: </span>
                        <InputNumber value={this.state.discountInput} min={0}
                                     max={100}
                                     step={5}
                                     onChange={this.handleDiscountChange}
                                     formatter={value => `${value}%`}
                                     parser={value => value.replace('%', '')}/>
                        <br/>
                        <Title level={4}>Вкупно за плаќање: {this.state.totalSum} денари</Title>
                        <Button htmlType={"button"} type={"primary"}
                                icon={"key"} block ghost onClick={this.handleSubmit}>Плати</Button>
                    </div>
                </div>

            </div>
        );
    }
}


const mapStateToProps = state => ({
    storeProducts: state.products.products,
    allProducts: state.products.productByID,
    cartItems: state.cartItem.cartItems,
    cart: state.cartItem.cart,
    customers: state.customers.customers,
});
export default connect(
    mapStateToProps,
    {
        getCart,
        updateCartItem,
        getCustomers,
        deleteCartItem,
        updateCart,
        addCustomer,
    }
)(Cart);
