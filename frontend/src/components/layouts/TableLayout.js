import {Button, Form, Input, InputNumber, Popconfirm, Table,} from 'antd';
import React, {Component} from 'react';
import * as PropTypes from "prop-types";
import ModalPopup from "./ModalPopup";
import ProductFlow from "./ProductFlow";
import {connect} from 'react-redux';
import {addCartItem} from "../../actions/cartItems";
import KeyHandler, {KEYPRESS} from "react-key-handler";

const FormItem = Form.Item;
const EditableContext = React.createContext();


const expandedRowRender = (record, data) => {
    const columns = [
        {title: 'Продавница', dataIndex: 'location'},
        {title: 'Количина', dataIndex: 'available_quantity'},
    ];
    const dataSource = data.find(object => object.key === record.key).products;
    return (
        <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            style={{width: '20%', float: "right", marginRight: "30rem"}}
        />
    );

};
const EditableRow = ({form, index, ...props}) => (
    <EditableContext.Provider value={form}>
        <tr {...props} />
    </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends Component {
    state = {
        editing: false,
    };

    toggleEdit = () => {
        const editing = !this.state.editing;
        this.setState({editing}, () => {
            if (editing) {
                this.input.focus();
            }
        });
    };

    save = (e) => {
        const {record, handleSave} = this.props;
        this.form.validateFields((error, values) => {
            if (error && error[e.currentTarget.id]) {
                return;
            }
            this.toggleEdit();
            handleSave({...record, ...values});
        });
    };

    render() {
        const {editing} = this.state;
        const {
            editable,
            dataIndex,
            title,
            record,
            index,
            handleSave,
            ...restProps
        } = this.props;
        return (
            <td {...restProps}>
                {editable ? (
                    <EditableContext.Consumer>
                        {(form) => {
                            this.form = form;
                            return (
                                editing ? (
                                    <FormItem style={{margin: 0}}>
                                        {form.getFieldDecorator(dataIndex, {
                                            rules: [{
                                                required: true,
                                                message: `${title} is required.`,
                                            }],
                                            initialValue: record[dataIndex],
                                        })(
                                            <Input
                                                ref={node => (this.input = node)}
                                                onPressEnter={this.save}
                                                onBlur={this.save}
                                            />
                                        )}
                                    </FormItem>
                                ) : (
                                    <div
                                        className="editable-cell-value-wrap"
                                        style={{paddingRight: 24}}
                                        onClick={this.toggleEdit}
                                    >
                                        {restProps.children}
                                    </div>
                                )
                            );
                        }}
                    </EditableContext.Consumer>
                ) : restProps.children}
            </td>
        );
    }
}


class EditableTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            buttonClass: '',
        };

        this.columns = [...this.props.columns, {
            title: 'operation',
            dataIndex: 'operation',
            render: (text, record) => (
                this.props.data.length >= 1
                    ? (
                        <span>
                            <Button className="focused-link" type="link"
                                    disabled={record.available_quantity <= 0}
                                    onClick={() => this.handleAddToCart(record)}>Додади во кошничка</Button>
                            <ModalPopup content={<ProductFlow storeProductID={record.id} productID={record.key}/>}
                                        title={'Прием/Повратница на: ' + record.description}
                                        isButton={false} record={record}/>
                            <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record.key)}>
                                <a href="javascript:;">Избриши</a>
                            </Popconfirm>
                        </span>
                    ) : null
            ),
        }];
    }


    static propTypes = {
        deleteFunction: PropTypes.func.isRequired,
        updateFunction: PropTypes.func.isRequired,
        data: PropTypes.array.isRequired,
        addCartItem: PropTypes.func.isRequired,
    };


    handleDelete = (key) => {
        this.props.deleteFunction(key);
    };

    handleSave = (row) => {
        this.props.updateFunction(row.key, row);
    };

    render() {
        const dataSource = this.props.data;
        const components = {
            body: {
                row: EditableFormRow,
                cell: EditableCell,
            },
        };
        const columns = this.columns.map((col) => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: record => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave,
                }),
            };
        });
        return (
            <div>
                <Table
                    components={components}
                    expandedRowRender={(record) => expandedRowRender(record, this.props.otherStoreData)}
                    rowClassName={() => 'editable-row'}
                    dataSource={dataSource}
                    columns={columns}
                    bordered
                />
            </div>
        );
    }

    handleAddToCart = (record) => {
        this.props.addCartItem(record);
    }
}

export default connect(null, {addCartItem})(EditableTable);