import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as PropTypes from "prop-types";
import {deleteCart, getCartItemsForDay, getCartsForDay} from "../../actions/cartItems";
import moment from 'moment';
import {Button, Card, Col, DatePicker, Divider, Icon, Popconfirm, Row, Table} from "antd";
import ModalPopup from "./ModalPopup";
import CartItemDetails from "../CartItemDetails";
import Title from "antd/lib/typography/Title";
import {getStores} from "../../actions/stores";


class SalesOverview extends Component {

    constructor(props) {
        super(props);
        this.state = {
            date: moment().format('DD-MM-YYYY'),
            storeID: this.props.currentStore.id,
            spin: true,
            registered: false,
            pagination: {
                defaultPageSize: 20,
            },
        };
    }

    static propTypes = {
        alert: PropTypes.object.isRequired,
        cartItemsForDate: PropTypes.array.isRequired,
        cartsForDate: PropTypes.array.isRequired,
        stores: PropTypes.array.isRequired,
        totalSum: PropTypes.number.isRequired,
        registeredSum: PropTypes.number.isRequired,
        cashSum: PropTypes.number.isRequired,
        paginationCount: PropTypes.number.isRequired,
        loading: PropTypes.bool.isRequired,
        getCartItemsForDay: PropTypes.func.isRequired,
        getCartsForDay: PropTypes.func.isRequired,
        getStores: PropTypes.func.isRequired,
        deleteCart: PropTypes.func.isRequired,
    };


    fetchData = () => {
        const {storeID, date, pagination} = this.state;
        this.props.getCartsForDay(date, storeID, pagination.current);
        this.props.getCartItemsForDay(date, storeID);
    };


    componentDidMount() {
        const {getStores, stores, alert} = this.props;
        if (stores.length <= 0) getStores();
        if (alert.alert) this.setState({registered: alert.alert});
        this.fetchData();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {alert, cartsForDate, paginationCount} = this.props;
        if (prevProps.cartsForDate !== cartsForDate) {
            const pagination = {...this.state.pagination};
            pagination.total = paginationCount;
            this.setState({pagination: pagination, spin:false});
        }
        if (prevState.storeID !== this.state.storeID ||
            prevState.pagination.current !== this.state.pagination.current ||
            prevState.date !== this.state.date) {
            this.fetchData();
        }
        if (prevProps.alert !== alert) {
            this.setState({registered: alert.alert});
        }
    }

    prepareStoreFilters = () => {
        const data = [];
        for (let store of this.props.stores) {
            const dataObject = {
                'text': store.location,
                'value': store.id,
            };
            data.push(dataObject);
        }
        return data;
    };

    prepareData = () => {
        const data = [];
        let {cartsForDate} = this.props;
        const {registered} = this.state;
        if (registered) {
            cartsForDate = cartsForDate.filter(cart => cart.registered)
        }
        for (let cart of cartsForDate) {
            const cartItems = this.props.cartItemsForDate.filter(ci => ci.sale === cart.id);
            const totalItemsBought = cartItems.reduce((previousValue, {bought_quantity}) => previousValue + bought_quantity, 0);
            const dataObject = {
                'key': cart.id,
                ...cart,
                'totalProducts': totalItemsBought,
                'store': cart.store,
                'cartItems': cartItems,
            };
            data.push(dataObject);
        }
        return data;
    };


    handleDateInput = (date, dateString) => {
        this.setState({date: date.format('DD-MM-YYYY'), spin: true})
    };

    handleDateButton = (event, nextDay) => {
        const currentDate = moment(this.state.date, 'DD-MM-YYYY');
        const newDate = nextDay ? currentDate.add(1, 'd') : currentDate.subtract(1, 'd');
        this.setState({date: newDate.format('DD-MM-YYYY'), spin: true})
    };

    handleChange = (pagination, filters, sorter) => {
        const pager = {...this.state.pagination};
        pager.current = pagination.current;
        this.setState({
            pagination: pager,
            storeID: filters.store[0],
            spin: true,
        });
    };

    render() {
        const dataSource = this.prepareData();
        let {storeID, registered} = this.state;

        const columns = [{
            title: 'Време',
            dataIndex: 'date_sold',
            align: 'center',
            render: text => moment(text).format('HH:mm:ss'),
        }, {
            title: 'Количина купени артикли',
            dataIndex: 'totalProducts',
            render: (text, record) => <ModalPopup isButton={false} title={<b>{text} артикли</b>}
                                                  content={<CartItemDetails cartItems={record.cartItems}/>}/>
        }, {
            title: 'Попуст',
            dataIndex: 'discount',
            render: text => text + ' %'
        }, {
            title: 'Вкупна сума',
            dataIndex: 'total_sum',
            render: text => text + ' ден.',
        }, {
            align: 'center',
            title: 'Фискална',
            dataIndex: 'registered',
            render: text => (text ?
                <Icon style={{fontSize: '25px'}} type="check-circle" theme="twoTone" twoToneColor={"#42f486"}/> :
                <Icon twoToneColor={"#ff5323"} type="close-circle" style={{fontSize: '25px'}} theme="twoTone"/>),
            filters: [{
                text: 'Фискална',
                value: true
            }, {
                text: 'Кеш',
                value: false
            }],
            onFilter: (value, record) => record.registered === value,
        }, {
            title: 'Продавница',
            dataIndex: 'store',
            filters: this.prepareStoreFilters(),
            filterMultiple: false,
            filteredValue: [storeID,] || null,
            onFilter: (value, record) => record.store === value,
        }, {
            title: 'Операции',
            dataIndex: 'operations',
            render: (text, record) => (
                <Popconfirm title="Дали сте сигурни ?"
                            onConfirm={() => this.props.deleteCart(record.key)}
                            icon={<Icon type="question-circle-o" style={{color: 'red'}}/>}>
                    <Icon theme="twoTone" type="delete" style={{fontSize: 25}}
                          twoToneColor="#ff4242"/>
                </Popconfirm>
            )
        }];
        if (registered) columns.splice(4, 1);

        const locale = {
            filterConfirm: 'Ok',
            filterReset: 'Ресетирај',
            emptyText: 'Нема податоци',
        };

        return (
            <React.Fragment>
                <Row gutter={16}>
                    <Col span={11}>
                        <Card title={"Избери датум за приказ на податоците"} bordered={false}
                              headStyle={{fontWeight: 'bold', fontSize: '25px'}}>
                            <Button type={"primary"} size={"large"} ghost
                                    onClick={(e) => this.handleDateButton(e, false)}>
                                <Icon type="step-backward"/>Претходен ден</Button>
                            <Divider type={"vertical"}/>
                            <DatePicker size={"large"} allowClear={false} onChange={this.handleDateInput}
                                        placeholder="Избери ден"
                                        value={moment(this.state.date, 'DD-MM-YYYY')}/>
                            <Divider type={"vertical"}/>
                            <Button type={"primary"} size={"large"} ghost
                                    disabled={this.state.date === moment().format('DD-MM-YYYY')}
                                    onClick={(e) => this.handleDateButton(e, true)}>Следен ден
                                <Icon style={{verticalAlign: 'middle'}} type="step-forward"/></Button>
                        </Card>
                    </Col>
                    <Col span={1} className="text-center">
                        <Divider type="vertical" style={{height: 200}}/>
                    </Col>
                    <Col span={11}>
                        <Card title="Вкупен промет" headStyle={{fontWeight: 'bold', fontSize: '25px'}}
                              bordered={false}>
                            <h5>Фискална: {this.props.registeredSum} денари</h5>
                            <h5>Кеш: {this.props.cashSum} денари</h5>
                            <h4>Вкупно: {this.props.totalSum} денари</h4>
                        </Card>
                    </Col>
                </Row>
                <Divider dashed/>
                <Table bordered
                       title={() => <Title className="text-center" level={3}> Податоци за
                           ден {this.state.date} во {this.props.stores.find(s => s.id === storeID).location}</Title>}
                       dataSource={dataSource}
                       pagination={this.state.pagination}
                       columns={columns}
                       locale={locale}
                       loading={this.state.spin}
                       onChange={this.handleChange}/>
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => ({
    cartItemsForDate: state.cartItem.cartItemsForCustomer,
    cartsForDate: state.cartItem.cartsForCustomer,
    totalSum: state.cartItem.totalSum,
    cashSum: state.cartItem.cashSum,
    registeredSum: state.cartItem.registeredSum,
    stores: state.stores.stores,
    currentStore: state.stores.currentStore,
    alert: state.alerts,
    paginationCount: state.cartItem.paginationCount,
    loading: state.cartItem.spin
});

export default connect(
    mapStateToProps,
    {
        getCartItemsForDay,
        getCartsForDay,
        getStores,
        deleteCart,
    }
)(SalesOverview);
