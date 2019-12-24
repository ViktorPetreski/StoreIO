import React, {Component} from 'react';
import {connect} from "react-redux";
import {putManufacturer} from "../actions/manufacturers";
import * as PropTypes from "prop-types";

import {
    Form, Input, Button, Checkbox,
} from 'antd';

function hasErrors(fieldsError) {
    return Object.keys(fieldsError).some(field => fieldsError[field]);
}

class ManufacturerForm extends Component {

    static propTypes = {
        addFunction: PropTypes.func.isRequired,
        ruleMessage: PropTypes.string.isRequired,
        placeholder: PropTypes.string.isRequired,
        store: PropTypes.bool,
    };

    componentDidMount() {
        // To disabled submit button at the beginning.
        this.props.form.validateFields();
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const {name} = values;
                const object = {
                    name
                };
                if (this.props.store) object['is_warehouse'] = values.warehouse;
                this.props.addFunction(object);
            }
        });
    };

    render() {
        const {
            getFieldDecorator, getFieldsError, getFieldError, isFieldTouched,
        } = this.props.form;

        // Only show error after a field is touched.
        const userNameError = isFieldTouched('name') && getFieldError('name');
        return (
            <Form layout="inline" onSubmit={this.handleSubmit}>
                <Form.Item
                    validateStatus={userNameError ? 'error' : ''}
                    help={userNameError || ''}
                >
                    {getFieldDecorator('name', {
                        rules: [{required: true, message: this.props.ruleMessage}],
                    })(
                        <Input placeholder={this.props.placeholder}/>
                    )}
                </Form.Item>

                {this.props.store ?
                    <Form.Item>
                        {getFieldDecorator('warehouse', {
                            rules: [{required: true, message: this.props.ruleMessage}],
                            initialValue: false,
                        },)(
                            <Checkbox> Магацин? </Checkbox>
                        )}
                    </Form.Item> : ''}

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={hasErrors(getFieldsError())}
                    >
                        Додади
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

const WrappedHorizontalLoginForm = Form.create({name: 'horizontal_login'})(ManufacturerForm);


export default WrappedHorizontalLoginForm;