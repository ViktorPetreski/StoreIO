import React, {Component} from 'react';
import {connect} from 'react-redux';
import ModalPopup from "./ModalPopup";
import AddProduct from "./AddProduct";
import {deleteProduct, getAllProducts, getProducts, updateProduct} from "../../actions/products";
import * as PropTypes from "prop-types";
import TableLayout from "./TableLayout";
import Highlighter from 'react-highlight-words';
import {Button, Icon, Input, InputNumber} from "antd";
import KeyHandler, {KEYPRESS} from "react-key-handler";
import KeyboardEventHandler from "react-keyboard-event-handler";
import {getManufacturers} from "../../actions/manufacturers";

class Products extends Component {

    constructor(props) {
        super(props);
        this.state = {
            preparedProducts: [],
            searchText: '',
            inputValue: 1,
        };
    }

    static propTypes = {
        getProducts: PropTypes.func.isRequired,
        deleteProduct: PropTypes.func.isRequired,
        updateProduct: PropTypes.func.isRequired,
        getAllProducts: PropTypes.func.isRequired,
        getManufacturers: PropTypes.func.isRequired,
        storeProducts: PropTypes.array.isRequired,
        allProducts: PropTypes.array.isRequired,
        currentUserStoreProducts: PropTypes.array.isRequired,
        stores: PropTypes.array.isRequired,
        manufacturers: PropTypes.array.isRequired,
    };

    getColumnSearchProps = dataIndex => ({
        filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
            <div style={{padding: 8}}>
                <Input
                    ref={node => {
                        this.searchInput = node;
                    }}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
                    style={{width: 188, marginBottom: 8, display: 'block'}}
                />
                <Button
                    type="primary"
                    onClick={() => this.handleSearch(selectedKeys, confirm)}
                    icon="search"
                    size="small"
                    style={{width: 90, marginRight: 8}}
                >
                    Пребарај
                </Button>
                <Button onClick={() => this.handleReset(clearFilters)} className="clear-filters-button" size="small"
                        style={{width: 90}}>
                    Ресетирај
                </Button>
            </div>
        ),
        filterIcon: filtered => (
            <Icon className="icon-filter" type="search" style={{color: filtered ? '#1890ff' : undefined}}/>
        ),
        onFilter: (value, record) =>
            record[dataIndex]
                .toString()
                .toLowerCase()
                .includes(value.toLowerCase()),
        onFilterDropdownVisibleChange: visible => {
            if (visible) {
                setTimeout(() => this.searchInput.select());
            }
        },
        render: text => (
            <Highlighter
                highlightStyle={{backgroundColor: '#ffc069', padding: 0}}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={text.toString()}
            />
        ),
    });

    handleQuantityChange = (record, value) => {
        record['bought_quantity'] = value;
    };

    toggleSearchByCode = e => {
        document.getElementsByClassName('icon-filter')[0].click();
    };

    toggleSearchByDescription = e => {
        document.getElementsByClassName('icon-filter')[1].click();
    };

    toggleSearchByPrice = e => {
        document.getElementsByClassName('icon-filter')[2].click();
    };

    clickClearFiltersButton = e => {
        const {searchText} = this.state;
        if (searchText !== '')
            document.getElementsByClassName('clear-filters-button')[0].click();
            document.getElementsByClassName('clear-filters-button')[1].click();
            document.getElementsByClassName('clear-filters-button')[2].click();
    };


    handleSearch = (selectedKeys, confirm) => {
        confirm();
        this.setState({searchText: selectedKeys[0]});
        const element = document.getElementById('availableQuantity' + selectedKeys[0]);
        if (element) element.select()
    };

    handleReset = clearFilters => {
        clearFilters();
        this.setState({searchText: ''});
    };

    prepareProducts = () => {
        const data = [];
        let otherProducts = [];
        let tmpArray = this.props.storeProducts;
        tmpArray = tmpArray.filter(i => !this.props.currentUserStoreProducts.some(item => item.id === i.id));
        const otherStoreData = [];
        tmpArray.forEach(item => {
            const {available_quantity, store, id, product} = item;
            const {location} = this.props.stores.find(s => s.id === store);
            const object = {
                'key': id,
                product,
                available_quantity,
                location
            };
            otherStoreData.push(object);
        });
        for (let product of this.props.allProducts) {
            const currentStoreProduct = this.props.currentUserStoreProducts.find(p => p.product === product.id);
            let productNotFound = {...this.props.storeProducts.find(p => p.product === product.id)};
            productNotFound['available_quantity'] = 0;
            const neededStoreProduct = currentStoreProduct ? currentStoreProduct : productNotFound;
            const manufacturerName = this.props.manufacturers.find(m => m.id === product.manufacturer);
            const prepareProduct = {
                'key': product.id,
                'bought_quantity': 1,
                'manufacturer_name': manufacturerName? manufacturerName.name : '',
                ...product,
                ...neededStoreProduct
            };
            data.push(prepareProduct);

            const someTmp = {
                'key': product.id,
                'products': otherStoreData.filter(p => p.product === product.id)
            };
            otherProducts.push(someTmp);
        }
        return {
            mainData: data,
            otherStoreData: otherProducts,
        };
    };

    prepareColumns = () => {
        return [{
            title: 'Шифра',
            dataIndex: 'code',
            width: '5%',
            ...this.getColumnSearchProps('code'),
        }, {
            title: 'Опис',
            dataIndex: 'description',
            width: '15%',
            editable: true,
            ...this.getColumnSearchProps('description'),
        }, {
            title: 'Набавна цена',
            dataIndex: 'raw_price',
            editable: true,
            render: (text) => <span> {text + ' ден.'} </span>
        }, {
            title: 'Продажна цена',
            dataIndex: 'regular_price',
            editable: true,
            render: (text) => <span> {text + ' ден.'} </span>
        }, {
            title: 'Попуст',
            dataIndex: 'discount',
            editable: true,
            width: '10%',
            render: (text) => <span> {text + ' %'} </span>
        }, {
            title: 'Цена со попуст',
            dataIndex: 'discounted_price',
            render: (text) => <span> {text ? text + ' ден.' : ''} </span>
        }, {
            title: 'Количина на лагер',
            dataIndex: 'available_quantity',
            width: '5%',
        }, {
            title: 'Добавувач',
            dataIndex: 'manufacturer_name',
            ...this.getColumnSearchProps('stock_source'),
        }, {
            title: 'Количина за купување',
            dataIndex: 'bought_quantity',
            render: (text, row) => <InputNumber min={1}
                                                disabled={row.available_quantity <= 0}
                                                max={row.available_quantity}
                                                defaultValue={this.state.inputValue}
                                                onChange={(value) => this.handleQuantityChange(row, value)}
                                                id={'availableQuantity' + row.code}/>
        },];
    };

    componentDidMount() {
        const {allProducts} = this.props;
        if (allProducts.length <= 0) this.props.getAllProducts();
    }

    componentWillMount() {
        const {storeProducts, manufacturers} = this.props;
        if (storeProducts.length <= 0) this.props.getProducts();
        if (manufacturers.length <= 0) this.props.getManufacturers();
    }


    render() {
        const data = this.prepareProducts();
        const columns = this.prepareColumns();
        return (
            <div>
                <KeyboardEventHandler
                    handleKeys={['s']}
                    onKeyEvent={this.toggleSearchByCode}/>
                <KeyboardEventHandler
                    handleKeys={['o']}
                    onKeyEvent={this.toggleSearchByDescription}/>
                <KeyboardEventHandler
                    handleKeys={['d']}
                    onKeyEvent={this.toggleSearchByPrice}/>
                <KeyboardEventHandler
                    handleKeys={['esc']}
                    onKeyEvent={this.clickClearFiltersButton}/>

                <ModalPopup content={<AddProduct/>} title="Додади артикл" isButton={true}/>
                <br/>
                <TableLayout data={data.mainData} columns={columns} otherStoreData={data.otherStoreData}
                             deleteFunction={this.props.deleteProduct} updateFunction={this.props.updateProduct}/>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    storeProducts: state.products.products,
    allProducts: state.products.productByID,
    currentUserStoreProducts: state.products.currentUserStoreProducts,
    stores: state.stores.stores,
    manufacturers: state.manufacturers.manufacturers
});


export default connect(mapStateToProps, {
    getProducts,
    deleteProduct,
    updateProduct,
    getAllProducts,
    getManufacturers,
})(Products);
