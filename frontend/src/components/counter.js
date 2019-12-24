import React, {Component} from 'react';
import {connect} from 'react-redux';
import ListView from "./layouts/listView";
import {getManufacturers, putManufacturer} from "../actions/manufacturers";
import ManufacturerForm from "./manufacturerForm";
import * as PropTypes from "prop-types";
import ModalPopup from "./layouts/ModalPopup";

class Counter extends Component {
    static propTypes = {
        manufacturers: PropTypes.array.isRequired,
        getManufacturers: PropTypes.func.isRequired,
        putManufacturer: PropTypes.func.isRequired,
    };

    componentDidMount() {
        this.props.getManufacturers();
    }

    render() {
        return (
            <div>
                <ModalPopup content={<ManufacturerForm addFunction={this.props.putManufacturer} ruleMessage="Внеси добавувач!" placeholder="Внеси име на добавувач"/>}
                            title="Додади добавувач" isButton={true}/>
                <br/>
                <ListView data={this.props.manufacturers}/>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    manufacturers: state.manufacturers.manufacturers
});
export default connect(mapStateToProps, {getManufacturers, putManufacturer})(Counter);