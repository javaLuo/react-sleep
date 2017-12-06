/* 产品管理 */

// ==================
// 所需的各种插件
// ==================

import React from 'react';
import { connect } from 'react-redux';
import { Link, BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import P from 'prop-types';
import './index.scss';

// ==================
// 所需的所有组件
// ==================

import List from './container/List';
import Type from './container/Type';
import Model from './container/Model';
import OrderList from './container/OrderList';
// ==================
// 本页面所需action
// ==================

import { } from '../../a_action/app-action';

// ==================
// Definition
// ==================

class TheContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount() {
        console.log('这是什么：', this.props.match);
    }

    componentWillReceiveProps(nextP) {
    }

    render() {
        return (
            <div key='page' className="allpage page-shop">
                <Switch>
                    <Redirect exact from={`${this.props.match.path}`} to={`${this.props.match.path}/list`} />
                    <Route exact path={`${this.props.match.path}/list`} component={List} />
                    <Route exact path={`${this.props.match.path}/type`} component={Type} />
                    <Route exact path={`${this.props.match.path}/model`} component={Model} />
                    <Route exact path={`${this.props.match.path}/orderlist`} component={OrderList} />
                </Switch>
            </div>
        );
    }
}

// ==================
// PropTypes
// ==================

TheContainer.propTypes = {
    location: P.any,
    history: P.any,
    match: P.any,
    actions: P.any,
};

// ==================
// Export
// ==================

export default connect(
    (state) => ({

    }),
    (dispatch) => ({
        actions: bindActionCreators({ }, dispatch),
    })
)(TheContainer);