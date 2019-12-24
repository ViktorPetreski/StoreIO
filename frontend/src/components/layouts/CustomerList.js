import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Avatar, List} from "antd";
import avatar from '../../assets/images/female-avatar.png'
import {getCustomers} from "../../actions/customers";
import * as PropTypes from "prop-types";
import ModalPopup from "./ModalPopup";
import CustomerDetails from "./CustomerDetails";

class CustomerList extends Component {
    static propTypes = {
        customers: PropTypes.array.isRequired,
        getCustomers: PropTypes.func.isRequired,
    };

    componentDidMount() {
        this.props.getCustomers();
    }

    render() {
        return (
            <div>
                <List
                    itemLayout="horizontal"
                    dataSource={this.props.customers}
                    style={{width: 900, margin: 'auto'}}
                    renderItem={item => (
                        <List.Item key={item.id}>
                            <List.Item.Meta
                                avatar={<Avatar
                                    src={avatar}/>}
                                title={<ModalPopup width={650} content={<CustomerDetails customerID={item.id}/>} title={item.name} isButton={false}/>}
                            />
                            <p>Должи: {item.owes} ден.</p>
                        </List.Item>
                    )}
                />
            </div>
        );
    }
}

const mapStateToProps = state =>({
    customers: state.customers.customers,
});

export default connect(
    mapStateToProps,
    {
        getCustomers,
    }
)(CustomerList);
