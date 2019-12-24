import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as PropTypes from "prop-types";
import {Table} from "antd";
import {getAllProducts, getProducts} from "../actions/products";
import {InputNumber} from "antd/es";
import {updateCartItem} from "../actions/cartItems";

class CartItemDetails extends Component {
    static propTypes = {
        cartItems: PropTypes.array.isRequired,
        allProducts: PropTypes.array.isRequired,
        storeProducts: PropTypes.array.isRequired,
        getAllProducts: PropTypes.func.isRequired,
        getProducts: PropTypes.func.isRequired,
        updateCartItem: PropTypes.func.isRequired,
    };

    componentWillMount() {
        this.props.getAllProducts();
        this.props.getProducts();
    }

    prepareData = () => {
        const data = [];
        if(this.props.allProducts.length > 0 && this.props.storeProducts.length > 0) {
            for (let ci of this.props.cartItems) {
                const product = this.props.allProducts.find(p => p.id === this.props.storeProducts.find(sp => sp.id === ci.product).product);
                const dataObject = {
                    'key': ci.id,
                    ...ci,
                    'description': product.description,
                    'originalPrice': ci.combined_price / ci.bought_quantity
                };
                data.push(dataObject);
            }
        }
        return data;
    };

    updateCartItem = (value, record) => {
        record['bought_quantity'] = value;
        console.log(record);
        const object = {
            'bought_quantity': value,
            'store_product': record.product,
        };
        this.props.updateCartItem(record.key, object);
    };

    render() {
        const columns = [{
            title: 'Артикл',
            dataIndex: 'description',
        }, {
            title: 'Цена',
            dataIndex: 'originalPrice',
            render: text => text + ' ден.'
        }, {
            align: 'center',
            title: 'Количина',
            dataIndex: 'bought_quantity',
            render: (text,record) => <InputNumber value={text} onChange={(value) => this.updateCartItem(value, record)}/>
        }, {
            title: 'Вкупна цена',
            dataIndex: 'combined_price',
            render: text => text + ' ден.'
        }];
        return (
            <Table columns={columns} dataSource={this.prepareData()}/>
        );
    }
}

const mapStateToProps = (state) => ({
    allProducts: state.products.productByID,
    storeProducts: state.products.products,
});

export default connect(
    mapStateToProps,
    {
        getProducts,
        getAllProducts,
        updateCartItem,
    }
)(CartItemDetails);
