import {List, Card, Popconfirm, Icon, Typography, Input, Divider} from 'antd';

import React, {Component} from 'react';
import {connect} from "react-redux";
import {deleteManufacturer, updateManufacturer} from "../../actions/manufacturers";
import * as PropTypes from "prop-types";
import {getAllProducts} from "../../actions/products";
import {getStores} from "../../actions/stores";
import KeyboardEventHandler from "react-keyboard-event-handler";
import ModalPopup from "./ModalPopup";
import AddProduct from "./AddProduct";

const {Title} = Typography;

class ListView extends Component {

    constructor(props) {
        super(props);
        this.state = {
            called: false,
            editing: false,
            manufacturerID: -1,
        }
    }

    static propTypes = {
        deleteManufacturer: PropTypes.func.isRequired,
        manufacturers: PropTypes.array.isRequired,
        products: PropTypes.array.isRequired,
        getAllProducts: PropTypes.func.isRequired,
        getStores: PropTypes.func.isRequired,
        updateManufacturer: PropTypes.func.isRequired,
    };


    componentDidMount() {
        this.props.getAllProducts();
        this.props.getStores();
    }

    toggleEditing = (e, value, manufacturerID) => {
        this.setState({editing: true, manufacturerID: manufacturerID});
        const name = `manufacturerName${manufacturerID}`;
        setTimeout(() => document.getElementById(name).select(), 200)
    };

    clearEditing = () => {
        this.setState({editing: false, manufacturerID: -1});
    };

    updateManufacturer = (e, manufacturerID) => {
        const {value} = e.target;
        this.setState({editing: false, manufacturerID: -1});
        const manu = {
            'name': value
        };
        this.props.updateManufacturer(manufacturerID, manu);
    };


    render() {
        const {editing, manufacturerID} = this.state;
        return (
            <React.Fragment>
                <KeyboardEventHandler
                    handleKeys={['esc']}
                    onKeyEvent={this.clearEditing}
                    handleFocusableElements
                />
                <List
                    grid={{
                        gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 6, xxl: 6,
                    }}
                    dataSource={this.props.manufacturers}
                    renderItem={item => (
                        <List.Item>
                            <Card headStyle={{fontSize: 22, fontWeight: 600}}
                                  title={editing && item.id === manufacturerID ?
                                      <Input id={`manufacturerName${item.id}`} defaultValue={item.name}
                                             onPressEnter={(e) => this.updateManufacturer(e, item.id)}/> : item.name}
                                  extra={
                                      <React.Fragment>
                                          <ModalPopup content={<AddProduct manufacturerID={item.id}/>} icon={true}
                                                      title={<Icon style={{fontSize: 25}} type="plus"/>} type="link"
                                                      isButton={true}/>
                                          <Divider type="vertical"/>
                                          < Icon style={{fontSize: 25}}
                                                 onClick={(e) => this.toggleEditing(e, item.name, item.id)}
                                                 type="edit" theme="twoTone"/>
                                          <Divider type="vertical"/>
                                          <Popconfirm title="Дали сте сигурни ?"
                                                      onConfirm={this.props.deleteManufacturer.bind(this, item.id)}
                                                      icon={<Icon type="question-circle-o" style={{color: 'red'}}/>}>
                                              <Icon theme="twoTone" type="delete" style={{fontSize: 25}}
                                                    twoToneColor="#ff4242"/>
                                          </Popconfirm>
                                      </React.Fragment>
                                  }>
                                <Title level={4}> Листа на артикли </Title>
                                <List
                                    size="small"
                                    dataSource={this.props.products.filter(p => p.manufacturer === item.id)}
                                    renderItem={product => (
                                        <div><List.Item>Опис: {product.description}</List.Item></div>)}
                                />
                            </Card>
                        </List.Item>
                    )}
                />
            </React.Fragment>

        );
    }
}

const mapStateToProps = state => ({
    manufacturers: state.manufacturers.manufacturers,
    products: state.products.productByID
});

export default connect(mapStateToProps, {deleteManufacturer, getAllProducts, getStores, updateManufacturer})(ListView);