import {
    Form, Input, Button, Select, InputNumber, AutoComplete, Alert,
} from 'antd';

import React, {Component} from 'react';
import {connect} from "react-redux";
import * as PropTypes from "prop-types";
import {addProduct} from "../../actions/products";
import {putManufacturer} from "../../actions/manufacturers";

const Option = Select.Option;

class NormalLoginForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showManufacturer: false,
            hideAdditionalInputs: false,
            isSearching: false,
            searchValue: '',
            keyCode: null,
        };
    }

    static propTypes = {
        manufacturers: PropTypes.array.isRequired,
        addProduct: PropTypes.func.isRequired,
        allProducts: PropTypes.array.isRequired,
        putManufacturer: PropTypes.func.isRequired,
        manufacturerID: PropTypes.number,
    };


    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                let {code, manufacturer, description, raw_price, regular_price,
                    available_quantity, discount, stock_source, manufacturer_code} = values;
                const product = {
                    code,
                    manufacturer,
                    manufacturer_code,
                    description,
                    raw_price,
                    'raw_price_vat': 18,
                    regular_price,
                    available_quantity,
                    discount,
                    stock_source
                };
                this.props.addProduct(product);
                this.props.form.resetFields();
            }
        });
    };


    prepareCodeData = () => {
        const data = [];
        for (let product of this.props.allProducts) {
            data.push(product.code)
        }
        return data;
    };


    handleCodeChange = (value, data) => {
        this.setState({hideAdditionalInputs: data.includes(value)})
    };

    handleManufacturerSelect = (value, option) => {
        this.setState({isSearching: false, keyCode: null});
    };

    handleManufacturerSearch = (value) => {
        this.setState({isSearching: true});
    };

    onInputKeyDown = (e) => {
        let {keyCode, target} = e;
        const {isSearching} = this.state;
        if (keyCode === 13 && isSearching) {
            this.setState({keyCode: keyCode, searchValue: target.value});
        }
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {searchValue, isSearching, keyCode} = this.state;
        if (searchValue !== '' && isSearching && keyCode === 13) {
            this.props.putManufacturer({'name': searchValue});
            this.setState({isSearching: false, searchValue: '', keyCode: null})
        }
    }

    render() {
        const {getFieldDecorator} = this.props.form;
        const manufacturerList = [];
        for (let i = 0; i < this.props.manufacturers.length; i++) {
            manufacturerList.push(
                <Option key={i} value={this.props.manufacturers[i].id}>{this.props.manufacturers[i].name}</Option>);
        }

        const formItemLayout = {
            labelCol: {
                xs: {span: 30},
                sm: {span: 8},
            },
            wrapperCol: {
                xs: {span: 24},
                sm: {span: 16},
            },
        };

        const additionalInputs = (
            <span>
                 <Form.Item label="Опис">
                    {getFieldDecorator('description', {
                        rules: [{required: !this.state.hideAdditionalInputs, message: 'Внесете опис за артиклот'}],
                    })(
                        <Input placeholder="Опис"/>
                    )}
                </Form.Item>
                <Form.Item label="Цена без ддв">
                    {getFieldDecorator('raw_price', {
                        rules: [{required: !this.state.hideAdditionalInputs, message: 'Внесете цена'}],
                    })(
                        <InputNumber className="inputNumberWidth" placeholder="Цена"/>
                    )}
                </Form.Item>
                <Form.Item label="Продажна цена">
                    {getFieldDecorator('regular_price', {
                        rules: [{required: !this.state.hideAdditionalInputs, message: 'Внесете продажна цена'}],
                    })(
                        <InputNumber className="inputNumberWidth" placeholder="Цена"/>
                    )}
                </Form.Item>
                 <Form.Item label="Количина">
                    {getFieldDecorator('available_quantity', {
                        rules: [{required: !this.state.hideAdditionalInputs, message: 'Внесете количина'}],
                    })(
                        <InputNumber className="inputNumberWidth" placeholder="Количина на залиха"/>
                    )}
                </Form.Item>
                <Form.Item label="Попуст">
                    {getFieldDecorator('discount', {initialValue: 0})(
                        <InputNumber className="inputNumberWidth" placeholder="Попуст"/>
                    )}
                </Form.Item>


                <Form.Item label="Име на добавувач">
                    {getFieldDecorator('manufacturer', {initialValue: this.props.manufacturerID? this.props.manufacturerID: null})(
                        <Select
                            showSearch
                            optionFilterProp="children"
                            maxTagCount={5}
                            maxTagPlaceholder="Користи ја опцијата за пребарување за приказ на останатите добавувачи"
                            filterOption={(input, option) =>
                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            onSelect={this.handleManufacturerSelect}
                            onSearch={this.handleManufacturerSearch}
                            onInputKeyDown={this.onInputKeyDown}
                        >
                            {manufacturerList}
                        </Select>
                    )}
                </Form.Item>
            </span>
        );
        const codeData = this.prepareCodeData();
        return (
            <Form {...formItemLayout} onSubmit={this.handleSubmit} style={{width: 450, margin: "auto"}}>
                <Form.Item label="Шифра">
                    {getFieldDecorator('code', {
                        rules: [{required: true, message: 'Внесете шифра на артиклот'}]
                    })(
                        <AutoComplete
                            style={{width: 200}}
                            dataSource={codeData}
                            placeholder="Шифра"
                            filterOption={(inputValue, option) =>
                                option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                            onChange={(value) => this.handleCodeChange(value, codeData)}
                        />
                    )}
                </Form.Item>

                <Form.Item label="Шифра на добавувач">
                    {getFieldDecorator('manufacturer_code')(
                        <Input placeholder="Шифра на добуавувач"/>
                    )}
                </Form.Item>

                {this.state.hideAdditionalInputs ?
                    <Alert message="Артиклот постои! Ве молиме ажурирајте ја количината преку операциите во табелата"
                           type="error"/> : additionalInputs}
                <Form.Item>
                    <Button disabled={this.state.hideAdditionalInputs} type="primary" htmlType="submit"
                            className="login-form-button">
                        Додади
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

const WrappedNormalLoginForm = Form.create({name: 'normal_login'})(NormalLoginForm);

const mapStateToProps = state => ({
    manufacturers: state.manufacturers.manufacturers,
    allProducts: state.products.productByID,
});

export default connect(
    mapStateToProps,
    {
        addProduct,
        putManufacturer
    })(WrappedNormalLoginForm);