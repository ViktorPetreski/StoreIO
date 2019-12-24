import {Icon, Layout, Menu, Dropdown} from 'antd';
import React, {Component} from 'react';
import Counter from "../counter";
import Alerts from "./Alerts";
import {Link, Route, Switch} from "react-router-dom";
import Register from "../accounts/Register";
import Login from "../accounts/Login";
import PrivateRoute from "../common/PrivateRoute";
import {connect} from "react-redux";
import {logout} from "../../actions/auth";
import Products from "./Products";
import ModalPopup from "./ModalPopup";
import Cart from "./cart"
import ManufacturerForm from "../manufacturerForm";
import {addCustomer} from "../../actions/customers";
import {getCartItems} from "../../actions/cartItems";
import CustomerList from "./CustomerList";
import ProductFlowOverview from "./ProductFlowOverview";
import SalesOverview from "./SalesOverview";
import KeyboardEventHandler from "react-keyboard-event-handler";
import {inspectionAlert} from "../../actions/messages";
import * as PropTypes from "prop-types";
import {addStore} from "../../actions/stores";
import Dashboard from "./Dashboard";

const {Header, Content, Footer} = Layout;

class MainLayout extends Component {

    constructor(props) {
        super(props);
        this.state = {
            alert: false,
        }
    }


    static propTypes = {
        auth: PropTypes.object.isRequired,
        cartItems: PropTypes.array.isRequired,
        logout: PropTypes.func.isRequired,
        addCustomer: PropTypes.func.isRequired,
        getCartItems: PropTypes.func.isRequired,
        inspectionAlert: PropTypes.func.isRequired,
        addStore: PropTypes.func.isRequired,
    };

    componentDidMount() {
        this.props.getCartItems();
    }

    toggleCart = key => {
        document.getElementById('cart').click()
    };

    dispatchAlert = () => {
        this.props.inspectionAlert({alert: true});
        this.setState({alert: true});
    };
    dispatchAlertRevert = () => {
        this.props.inspectionAlert({alert: false});
        this.setState({alert: false});
    };

    render() {
        const {isAuthenticated, user} = this.props.auth;
        const menu = (
            <Menu>
                <Menu.Item key="0">
                    <ModalPopup content={<ManufacturerForm addFunction={this.props.addStore}
                                                           ruleMessage="Внеси локација на продавница"
                                                           placeholder="Локација" store/>}
                                title="Додади продавница" isButton={false}/>
                </Menu.Item>
                <Menu.Item key="6">
                    <ModalPopup content={<ManufacturerForm addFunction={this.props.addCustomer}
                                                           ruleMessage="Внеси муштерија!"
                                                           placeholder="Внеси опис на муштерија"/>}
                                title="Додади муштерија" isButton={false}/>
                </Menu.Item>
                <Menu.Item key="4"><Link to="/register">Регистрирај вработен</Link></Menu.Item>
                <Menu.Divider/>
                <Menu.Item key="3" onClick={this.props.logout}><Icon type="logout"/>Одјави се</Menu.Item>
            </Menu>
        );
        let total = 0;
        this.props.cartItems.forEach(cartItem => total += cartItem.bought_quantity);
        const artikli = total > 1 || total === 0 ? "артикли" : "артикл";
        const temp1 = <span><Icon id="cart" type="shopping-cart"
                                  style={{fontSize: 25}}/> {total} {artikli}</span>;
        const authLinks = (
            <Menu theme="dark" mode="horizontal" style={{lineHeight: '61px'}} className="float-right">
                <Menu.Item key={6}><ModalPopup content={<Cart/>} title={temp1} isButton={false}
                                               width={850}/></Menu.Item>
                <Dropdown overlay={menu} trigger={['click']}>
                    <a className="ant-dropdown-link" href="#" style={{fontSize: 20}}>
                        <Icon type="user"/> {user ? user.username : ''} <Icon type="down"/>
                    </a>
                </Dropdown>
            </Menu>
        );

        const guestLinks = (
            <Menu theme="dark" mode="horizontal" style={{lineHeight: '64px'}} className="float-right">
                <Menu.Item className="float-right" key="3"><Link to="/login">Логирај се</Link></Menu.Item>
                <Menu.Item className="float-right" key="4"><Link to="/register">Регистрирај се</Link></Menu.Item>
            </Menu>
        );


        return (
            <Layout>
                <KeyboardEventHandler
                    handleKeys={['f2', 'end']}
                    onKeyEvent={this.dispatchAlert}
                    handleFocusableElements
                />
                <KeyboardEventHandler
                    handleKeys={['ctrl + shift + f2']}
                    onKeyEvent={this.dispatchAlertRevert}
                    handleFocusableElements
                />
                <KeyboardEventHandler
                    handleKeys={['f1']}
                    onKeyEvent={this.toggleCart}
                    handleFocusableElements/>
                <Header style={{position: 'fixed', zIndex: 1, width: '100%'}}>
                    <div className="logo"/>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={['1']}
                        style={{lineHeight: '64px'}}
                    >
                        <Menu.Item key="1"><Link to="/">Производители</Link></Menu.Item>
                        <Menu.Item key="2"><Link to="/products">Артикли</Link></Menu.Item>
                        <Menu.Item key="3"><Link to="/customers">Муштерии</Link></Menu.Item>
                        <Menu.Item key="4"><Link to="/product-flow-overview">Движење на роба</Link></Menu.Item>
                        <Menu.Item key="5"><Link to="/sales-overview">Продажба</Link></Menu.Item>
                        <Menu.Item key="6"><Link to="/dashboard"><Icon type="pie-chart" theme="twoTone" />Dashboard</Link></Menu.Item>
                        {isAuthenticated ? authLinks : guestLinks}
                    </Menu>
                </Header>
                <Alerts/>
                <Content style={{padding: '0 50px', marginTop: 64}}>
                    <div style={{background: '#fff', padding: 24, minHeight: 380}}>
                        <Switch>
                            <PrivateRoute exact path="/" component={Counter}/>
                            <PrivateRoute exact path="/products" component={Products}/>
                            <PrivateRoute path="/customers" component={CustomerList}/>
                            <PrivateRoute exact path="/product-flow-overview" component={ProductFlowOverview}/>
                            <PrivateRoute exact path="/sales-overview" component={SalesOverview}/>
                            <PrivateRoute exact path="/dashboard" component={Dashboard}/>
                            <Route exact path="/register" component={Register}/>
                            <Route exact path="/login" component={Login}/>
                        </Switch>
                    </div>
                </Content>
                <Footer style={{textAlign: 'center'}}>
                    Наше Трико©
                </Footer>
            </Layout>
        );
    }
}

const mapStateToProps = state => ({
    auth: state.auth,
    cartItems: state.cartItem.cartItems,
});

export default connect(mapStateToProps, {
    logout, addCustomer, getCartItems, inspectionAlert, addStore,
})(MainLayout);