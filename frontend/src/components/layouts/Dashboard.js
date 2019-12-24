import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
    getApproximateIncome,
    getProductAdditionFrequencyByMonth,
    getSalesFrequencyByMonth,
    getTopSellingProductsByMonth, getWeeklyIncome
} from "../../actions/dashboard";
import * as PropTypes from "prop-types";
import {Bar, Doughnut, Line} from 'react-chartjs-2'
import {Button, Card, Col, Divider, Icon, Radio, Row, Spin, Typography} from "antd";
import moment from 'moment';

// defaults.global.animation = false;

class Dashboard extends Component {

    constructor(props) {
        super(props);
        this.state = {
            unit: 'week',
            filter: moment().isBefore(moment(`${moment().year}-07-01`, "YYYY-MM-DD")) ? 1 : 0,
            labels: [],
            loading: true,
            redraw: false,
        }
    }

    static propTypes = {
        getTopSellingProductsByMonth: PropTypes.func.isRequired,
        getSalesFrequencyByMonth: PropTypes.func.isRequired,
        getProductAdditionFrequencyByMonth: PropTypes.func.isRequired,
        getApproximateIncome: PropTypes.func.isRequired,
        getWeeklyIncome: PropTypes.func.isRequired,
        topSellingProductsByMonthByStore: PropTypes.object.isRequired,
        salesFrequencyByMonthByStore: PropTypes.object.isRequired,
        revenue: PropTypes.object.isRequired,
        highestRevenueProductsByMonth: PropTypes.object.isRequired,
        productAdditionFrequencyByMonthByStore: PropTypes.object.isRequired,
        annualSaleAndProdFlowData: PropTypes.object.isRequired,
    };

    componentDidMount() {
        const part = moment().isBefore(moment(`${moment().year}-07-01`, "YYYY-MM-DD")) ? 'second' : 'first';
        this.props.getTopSellingProductsByMonth();
        this.props.getSalesFrequencyByMonth();
        this.props.getProductAdditionFrequencyByMonth();
        this.props.getApproximateIncome(part);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {annualSaleAndProdFlowData: currentAnnualData} = this.props;
        const {annualSaleAndProdFlowData: prevAnnualData} = prevProps;
        if (prevAnnualData !== currentAnnualData) {
            this.setState({loading: false});
            this.chartReference.chartInstance.update();
        }

    }

    newLegendClickHandler = function (e, legendItem) {
        const index = legendItem.datasetIndex;
        let ci = this.chart;
        [
            ci.getDatasetMeta(index),
            ci.getDatasetMeta(index + 2)
        ].forEach(function (meta) {
            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
        });
        ci.update();
    };


    resetView = (e) => {
        this.setState({unit: 'week', loading: true, redraw: true});
        setTimeout(() => document.getElementById("annual-chart").scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        }), 500);
        setTimeout(() => this.props.getApproximateIncome(), 200);
    };

    focusWeek = (dataset) => {
        if (dataset.length > 0) {
            const {_index} = dataset[0];
            let chart = this.chartReference.chartInstance;
            const start = chart.data.labels[_index];
            const end = chart.data.labels[_index + 1];
            this.setState({unit: 'day', loading: true, redraw: false});
            setTimeout(() => this.props.getWeeklyIncome(start, end), 200);
            // setTimeout(() => document.getElementById("annual-chart").scrollIntoView(), 200);
        }
    };

    onChange = (e) => {
        const {value} = e.target;
        this.setState({filter: value, loading: true});
        if (value === 2) {
            this.props.getApproximateIncome();
        }
        if (value === 1) {
            this.props.getApproximateIncome('second');
        }
        if (value === 0) {
            this.props.getApproximateIncome('first');
        }
    };

    render() {
        const options = {
            tooltips: {
                mode: 'index'
            },
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],
            },
        };

        const lineChartOptions = {
            spanGaps: false,
            tooltips: {
                mode: 'index'
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    },
                    scaleLabel: {
                        labelString: 'Број на продажби',
                        display: true,
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Час од работното време'
                    }
                }]
            },
        };

        const pieChartOptions = {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Продукти со најголем приход',
                padding: 5,
            }
        };
        const {unit, loading} = this.state;
        const timeAxesOptions = {
            legend: {
                // onClick: this.newLegendClickHandler
            },
            tooltips: {
                mode: 'index',
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: unit,
                        stepSize: 1,
                        tooltipFormat: 'll'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        labelString: 'Денари',
                        display: true,
                    }
                }]
            },
            responsive: true,
        };

        const {
            topSellingProductsByMonthByStore: data,
            salesFrequencyByMonthByStore: salesFrequency,
            revenue,
            highestRevenueProductsByMonth,
            productAdditionFrequencyByMonthByStore: productAdditionsFrequency,
            annualSaleAndProdFlowData,
        } = this.props;

        const difference = revenue.current - revenue.previous;
        const icon = difference > 0 ? <Icon type="caret-up" style={{color: "#3aff72"}}/> :
            <Icon type="caret-down" style={{color: "#ff3939"}} theme="filled"/>;
        const percentageDiff = difference / revenue.previous * 100;
        return (
            <React.Fragment>
                <Row>
                    <Typography.Title level={1}>Месечен приказ</Typography.Title>
                    <Divider dashed/>
                    <Col span={9}>
                        <Card title="20 најпродавани артикли по продавница за овој месец">
                            <Bar data={data} options={options}/>
                        </Card>
                    </Col>
                    <Col span={1} className="text-center">
                        <Divider type="vertical" style={{height: 300, top: 50}}/>
                    </Col>
                    <Col span={9}>
                        <Card title="Број на продажби по продавница на часовно ниво во овој месец">
                            <Line data={salesFrequency} options={lineChartOptions}/>
                        </Card>
                    </Col>
                    <Col span={1} className="text-center">
                        <Divider type="vertical" style={{height: 300, top: 50}}/>
                    </Col>
                    <Col span={4}>
                        <Card title="Чист приход во сите продавници">
                            <p>За претходниот месец: {revenue.previous} ден.</p>
                            <p>За овој месец: {revenue.current} ден. {icon} {percentageDiff.toFixed(2)}%</p>
                            <p>За оваа година: {revenue.annual} ден.</p>
                            <Doughnut height={250} options={pieChartOptions} data={highestRevenueProductsByMonth}/>
                        </Card>
                    </Col>
                </Row>
                <Divider dashed/>
                <Row>
                    <Col span={8}>
                        <Card title="Број на нарачки по продавница">
                        <Line data={productAdditionsFrequency} options={lineChartOptions}/>
                        </Card>
                    </Col>
                </Row>
                <Divider/>
                <Row>
                    <Typography.Title level={1}>Годишен приказ</Typography.Title>
                    <Divider dashed/>
                    <Col span={8}>
                        <Typography.Title level={4}>Период на приказ:</Typography.Title>
                        <Radio.Group onChange={this.onChange} value={this.state.filter}>
                            <Radio value={0}>До 30ти Јуни</Radio>
                            <Radio value={1}>Од 1ви Јули</Radio>
                            <Radio value={2}>Цела година</Radio>
                        </Radio.Group>
                        {loading ? <Spin size="large"/> : ''}
                    </Col>
                    <Col span={10}>
                        <Button onClick={this.resetView} block type="primary" ghost><Icon type="reload"/>Назад на
                            годишен преглед</Button>
                    </Col>
                </Row>
                <Row style={{marginTop: 20}}>
                    <Line getElementAtEvent={this.focusWeek} ref={(reference) => this.chartReference = reference}
                          height={100} data={annualSaleAndProdFlowData || {}} options={timeAxesOptions}
                          redraw={this.state.redraw} id="annual-chart"/>
                </Row>
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => ({
    topSellingProductsByMonthByStore: state.dashboard.topSellingProductsByMonthByStore,
    salesFrequencyByMonthByStore: state.dashboard.salesFrequencyByMonthByStore,
    revenue: state.dashboard.revenue,
    highestRevenueProductsByMonth: state.dashboard.highestRevenueProductsByMonth,
    productAdditionFrequencyByMonthByStore: state.dashboard.productAdditionFrequencyByMonthByStore,
    annualSaleAndProdFlowData: state.dashboard.annualSaleAndProdFlowData,
});

export default connect(
    mapStateToProps,
    {
        getTopSellingProductsByMonth,
        getSalesFrequencyByMonth,
        getProductAdditionFrequencyByMonth,
        getApproximateIncome,
        getWeeklyIncome,
    }
)(Dashboard);
