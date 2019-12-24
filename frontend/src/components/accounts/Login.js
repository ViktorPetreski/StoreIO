import {
    Form, Icon, Input, Button, Checkbox, Typography,
} from 'antd';
import React, {Fragment} from "react";
import {Link, Redirect} from "react-router-dom";
import {connect} from "react-redux";
import {login} from "../../actions/auth";
import PropTypes from 'prop-types';

const {Title} = Typography;

class NormalLoginForm extends React.Component {
    static propTypes = {
        login: PropTypes.func.isRequired,
        isAuthenticated: PropTypes.bool
    };

    handleSubmit = (e) => {
        e.preventDefault();

        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.props.login(values.username, values.password);
                console.log('Received values of form: ', values);
            }
        });
    };

    render() {
        if(this.props.isAuthenticated){
            return <Redirect to="/"/>
        }
        const {getFieldDecorator} = this.props.form;
        return (
            <Fragment>
                <Title level={3} className="text-center">Логирај се</Title>
                <div className="d-flex justify-content-center">
                    <Form onSubmit={this.handleSubmit} className="login-form">
                        <Form.Item>
                            {getFieldDecorator('username', {
                                rules: [{required: true, message: 'Please input your username!'}],
                            })(
                                <Input prefix={<Icon type="user" style={{color: 'rgba(0,0,0,.25)'}}/>}
                                       placeholder="Username"/>
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('password', {
                                rules: [{required: true, message: 'Please input your Password!'}],
                            })(
                                <Input prefix={<Icon type="lock" style={{color: 'rgba(0,0,0,.25)'}}/>} type="password"
                                       placeholder="Password"/>
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('remember', {
                                valuePropName: 'checked',
                                initialValue: true,
                            })(
                                <Checkbox>Запамти ме</Checkbox>
                            )}
                            <Button type="primary" htmlType="submit" className="login-form-button">
                                Логирај се
                            </Button>
                            <p>Или <Link to="/register">регистрирај се!</Link></p>
                        </Form.Item>
                    </Form>
                </div>
            </Fragment>
        );
    }
}

const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated

});

const Login = Form.create({name: 'normal_login'})(NormalLoginForm);


export default connect(mapStateToProps, {login})(Login)