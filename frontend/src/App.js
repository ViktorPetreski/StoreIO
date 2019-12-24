import React, {Component} from 'react';
import './App.css';
import {Provider} from 'react-redux'
import MainLayout from "./components/layouts/mainLayout";
import store from "./store";
import "antd/dist/antd.css";
import {HashRouter as Router} from "react-router-dom";
import {loadUser} from "./actions/auth";


class App extends Component {
    componentDidMount() {
        store.dispatch(loadUser());
    }

    render() {
        return (
            <Provider store={store}>
                    <Router>
                        <MainLayout/>
                    </Router>
            </Provider>
        );
    }
}

export default App;
