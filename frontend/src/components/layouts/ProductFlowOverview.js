import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Table, DatePicker, Popconfirm, Icon, Button, Divider, Input, AutoComplete, Select} from "antd";
import * as PropTypes from "prop-types";
import {
    getProductFlows,
    removeProductFlow,
    searchByInvoiceNumber
} from "../../actions/products";
import moment from 'moment';
import {getStores} from "../../actions/stores";
import Title from "antd/lib/typography/Title";
import {deleteInvoice, getInvoices} from "../../actions/invoices";


const {MonthPicker} = DatePicker;

class ProductFlowOverview extends Component {

    constructor(props) {
        super(props);
        this.state = {
            month: '',
            data: this.props.flows,
            pagination: {},
            loading: true,
        }
    }

    static propTypes = {
        flows: PropTypes.array.isRequired,
        stores: PropTypes.array.isRequired,
        invoices: PropTypes.array.isRequired,
        paginationCount: PropTypes.number.isRequired,
        user: PropTypes.object.isRequired,
        getProductFlows: PropTypes.func.isRequired,
        getInvoices: PropTypes.func.isRequired,
        deleteInvoice: PropTypes.func.isRequired,
        removeProductFlow: PropTypes.func.isRequired,
        searchByInvoiceNumber: PropTypes.func.isRequired,
    };

    getFlows = () => {
        const {month, pagination} = this.state;
        this.props.getProductFlows(month, pagination.current);
    };

    componentWillMount() {
        if (this.props.invoices.length <= 0) this.props.getInvoices();
    }

    componentDidMount() {
        this.getFlows();
        this.props.getStores();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.month !== prevState.month) {
            this.getFlows();
        }
        if (prevProps.paginationCount !== this.props.paginationCount) {
            const pagination = {...this.state.pagination};
            pagination.total = this.props.paginationCount;
            this.setState({pagination: pagination})
        }
        if (prevProps.flows !== this.props.flows) {
            this.setState({loading: false})
        }
    }

    handleMonthChange = (date, dateString) => {
        const month = date.format('MM-YYYY');
        this.setState({month: month});
    };

    handlePageChange = (pagination, filters, sorter) => {
        const pager = {...this.state.pagination};
        pager.current = pagination.current;
        this.setState({
            pagination: pager,
            loading: true,
        });
        setTimeout(() => this.getFlows(), 500);
    };


    searchByInvoiceNumber = (value, option) => {
        if (value) this.props.searchByInvoiceNumber(value);
        else this.getFlows()
    };

    prepareInvoiceSelectOptions = () => {
        const finalData = [];
        for (let invoice of this.props.invoices) {
            finalData.push(
                <Select.Option value={invoice.id} key={invoice.id}>{invoice.invoice_number}</Select.Option>
            )
        }
        return finalData;
    };

    render() {
        const admin_operations = {
            title: 'Менаџирање',
            align: 'center',
            width: '10%',
            dataIndex: 'manage',
            render: (text, record) => (
                <React.Fragment>
                    {record.invoice_number ?
                        <Popconfirm title="Дали сте сигурни ?"
                                    onConfirm={() => this.props.deleteInvoice(record.invoice_id)}
                                    icon={<Icon type="question-circle-o" style={{color: 'red'}}/>}>
                            <Button type="link"> <Icon theme="twoTone" type="delete" twoToneColor="#ff4242"/> Избриши се
                                од фактура бр.&nbsp;{record.invoice_number}</Button><br/>
                        </Popconfirm> : ''}

                    <Popconfirm title="Дали сте сигурни ?"
                                onConfirm={() => this.props.removeProductFlow(record.key)}
                                icon={<Icon type="question-circle-o" style={{color: 'red'}}/>}>
                        <Button type="link">
                            <Icon theme="twoTone" type="delete" twoToneColor="#ff4242"/>
                            Избриши&nbsp;{record.operation ? 'го' : 'ја'}&nbsp;само
                            овој&nbsp;{record.operation ? 'прием' : 'повратница'}
                        </Button>
                    </Popconfirm>
                </React.Fragment>
            )
        };

        const columns = [{
                title: 'Број на фактура',
                dataIndex: 'invoice_number',
                width: 30,
            }, {
                title: 'Дата',
                dataIndex: 'date',
                key: 'date',
                render: (text) => moment(text).format('DD MMM YY')
            }, {
                title: 'Тип',
                dataIndex: 'operation',
                key: 'operation',
                render: text => text === 'ADD' ? 'Прием' : 'Повратница',
                filters: [{
                    text: 'Прием',
                    value: 'ADD',
                }, {
                    text: 'Повратница',
                    value: 'SUB',
                }],
                onFilter: (value, record) => record.operation === value,
            }, {
                title: 'Количина',
                dataIndex: 'quantity',
                render: text => <span>{text} {text === 1 ? 'парче' : 'парчиња'}</span>
            }, {
                title: 'Артикл',
                dataIndex: 'product',
            }, {
                title: 'Цена',
                dataIndex: 'price',
                render: text => text + ' ден.'
            }, {
                title: 'Од',
                dataIndex: 'info_from',
            }, {
                title: 'До',
                dataIndex: 'info_to',
                filters: [{
                    text: 'Драчево',
                    value: 'Dracevo'
                },{
                    text: 'Илинден',
                    value: 'Ilinden'
                },{
                    text: 'Маџари',
                    value: 'Madzari'
                }, {
                    text: 'Магацин',
                    value: 'Magacin',
                }],
                onFilter: (value, record) => record.info_to === value,
            }];

        if (this.props.user.is_superuser) columns.splice(columns.length, 0, admin_operations);

        const
            locale = {
                filterConfirm: 'Ok',
                filterReset: 'Ресетирај',
                emptyText: 'Нема податоци',
            };

        return (
            <div>
                <MonthPicker onChange={this.handleMonthChange} placeholder="Избери месец" format="MMMM YYYY"/>
                <Divider type="vertical"/>
                <Select
                    showSearch
                    allowClear
                    style={{width: 200}}
                    placeholder="Избери број на фактура"
                    optionFilterProp="children"
                    onChange={this.searchByInvoiceNumber}
                    filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
                    {this.prepareInvoiceSelectOptions()}
                </Select>
                <Divider dashed/>
                <Table
                    title={() => <Title className="text-center" level={3}> Податоци за
                        месец {this.state.month || moment().format("MM-YYYY")}</Title>}
                    bordered
                    columns={columns}
                    dataSource={this.props.flows}
                    pagination={this.state.pagination}
                    size={"small"}
                    locale={locale}
                    loading={this.state.loading}
                    rowKey={record => record.key}
                    onChange={this.handlePageChange}/>
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    flows: state.products.flows,
    stores: state.stores.stores,
    paginationCount: state.products.paginationCount,
    invoices: state.invoices.invoices,
    user: state.auth.user,
});

export default connect(
    mapStateToProps,
    {
        getStores,
        getInvoices,
        getProductFlows,
        deleteInvoice,
        removeProductFlow,
        searchByInvoiceNumber,
    }
)(ProductFlowOverview);
