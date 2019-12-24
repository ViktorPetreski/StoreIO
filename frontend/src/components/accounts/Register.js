import {
    Form, Input, Button, Card,
} from 'antd';
import React, {Component} from "react";
import {Link, Redirect} from "react-router-dom";
import {register} from "../../actions/auth";
import {connect} from "react-redux";
import {Radio} from 'antd';
import {getStores} from "../../actions/stores";
import * as PropTypes from "prop-types";

const RadioGroup = Radio.Group;

class RegistrationForm extends Component {
    state = {
        confirmDirty: false,
        autoCompleteResult: [],
        value: 0,
    };
    changeStoreValue = e => {
        this.setState({
            value: e.target.value,
        });
    };

    static propTypes = {
        isAuthenticated: PropTypes.bool,
        register: PropTypes.func.isRequired,
        getStores: PropTypes.func.isRequired,
        stores: PropTypes.array.isRequired,
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                const {username, password, email,store} = values;
                const newUser = {
                    username,
                    password,
                    email,
                    store
                };
                this.props.register(newUser);
            }
        });
    };

    handleConfirmBlur = (e) => {
        const value = e.target.value;
        this.setState({confirmDirty: this.state.confirmDirty || !!value});
    };

    compareToFirstPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && value !== form.getFieldValue('password')) {
            callback('Two passwords that you enter is inconsistent!');
        } else {
            callback();
        }
    };

    validateToNextPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && this.state.confirmDirty) {
            form.validateFields(['confirm'], {force: true});
        }
        callback();
    };

    componentDidMount() {
        this.props.getStores();
    }

    render() {
        const {getFieldDecorator} = this.props.form;

        const storeArray = [];
        for (let store of this.props.stores) {
            storeArray.push(<Radio key={store.id} value={store.id}>{store.location}</Radio>)
        }

        const formItemLayout = {
            labelCol: {
                xs: {span: 24},
                sm: {span: 18},
            },
            wrapperCol: {
                xs: {span: 20, offset: 2},
                sm: {span: 20},
            },
        };
        //button
        const tailFormItemLayout = {
            wrapperCol: {
                xs: {
                    span: 24,
                    offset: 20,
                },
                sm: {
                    span: 16,
                    offset: 7,
                },
            },
        };

        // if (this.props.isAuthenticated) {
        //     return <Redirect to="/"/>;
        // }

        return (
            <Card
                title="Регистрирај се"
                style={{width: 350, margin: "auto"}}
                headStyle={{textAlign: "center", color: '#8cb8ff', fontSize: 25, textTransform: "uppercase"}}
            >
                <Form {...formItemLayout} onSubmit={this.handleSubmit}>
                    <Form.Item>
                        {getFieldDecorator('username', {
                            rules: [{required: true, message: 'Please input your nickname!', whitespace: true}],
                        })(
                            <Input placeholder="Корисничко име"/>
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('password', {
                            rules: [{
                                required: true, message: 'Please input your password!',
                            }, {
                                validator: this.validateToNextPassword,
                            }],
                        })(
                            <Input placeholder="Лозинка" type="password"/>
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('confirm', {
                            rules: [{
                                required: true, message: 'Please confirm your password!',
                            }, {
                                validator: this.compareToFirstPassword,
                            }],
                        })(
                            <Input placeholder="Потврди лозинка" type="password" onBlur={this.handleConfirmBlur}/>
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('email', {
                            rules: [{
                                type: 'email', message: 'The input is not valid E-mail!',
                            }, {
                                required: true, message: 'Please input your E-mail!',
                            }],
                        })(
                            <Input placeholder="E-Mail"/>
                        )}
                    </Form.Item>

                    <Form.Item>
                        {getFieldDecorator('store', {
                            rules: [{
                                required: true, message: 'Please input your E-mail!',
                            }],
                            defaultValue: this.state.value,
                        })(
                            <RadioGroup onChange={this.changeStoreValue}>
                                {storeArray}
                            </RadioGroup>
                        )}

                    </Form.Item>

                    <Form.Item {...tailFormItemLayout}>
                        <Button type="primary" htmlType="submit">Регистрирај се</Button>
                        <p>или <Link to="/login">логирај се!</Link></p>
                    </Form.Item>
                </Form>
            </Card>
        );
    }
}

const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated,
    stores: state.stores.stores,
});

const Register = Form.create({name: 'Register.js'})(RegistrationForm);

export default connect(mapStateToProps, {register, getStores})(Register);