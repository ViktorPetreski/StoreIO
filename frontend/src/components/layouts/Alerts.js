import React, {Component, Fragment} from 'react';
import {connect} from "react-redux";
import * as PropTypes from "prop-types";
import {message as msg} from 'antd'


class Alerts extends Component {

    static propTypes = {
        error: PropTypes.object.isRequired,
        message: PropTypes.object.isRequired,
        alert: PropTypes.object.isRequired,
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {error, message, alert} = this.props;
        if (error !== prevProps.error) {
            if (error.message.name) msg.error(`Name: ${error.message.name.join()}`);
            if (error.message.detail) msg.error(error.message.detail);
            if (error.message.non_field_errors) msg.error(error.message.non_field_errors.join());
            if (error.message.username) msg.error(error.message.username.join());
            // if (error.message) msg.error(error.message.join());
        }

        if (message !== prevProps.message) {
            if (message.manufacturerDeleted) msg.info(message.manufacturerDeleted);
            if (message.manufacturerAdded) msg.success(message.manufacturerAdded);
            if (message.productDeleted) msg.info(message.productDeleted);
            if (message.productUpdated) msg.success(message.productUpdated);
            if (message.cartItemAdded) msg.success(message.cartItemAdded);
            if(message.registeredUser) msg.success(message.registeredUser);
        }

        if (alert !== prevProps.alert) {
            msg.success(alert.alert? "Filtrirano": "Nazad");
        }
    }

    render() {
        return <Fragment/>;
    }
}

const mapStateToProps = state => ({
    error: state.errors,
    message: state.messages,
    alert: state.alerts,
});

export default connect(mapStateToProps)(Alerts);