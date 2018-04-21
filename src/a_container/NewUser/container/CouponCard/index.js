/* Manager 系统管理/管理员信息管理 */

// ==================
// 所需的各种插件
// ==================

import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import P from "prop-types";
import moment from "moment";
import _ from "lodash";

import "./index.scss";
import tools from "../../../../util/tools"; // 工具
import Power from "../../../../util/power"; // 权限
import { power } from "../../../../util/data";
// ==================
// 所需的所有组件
// ==================

import {
  Form,
  Button,
  Icon,
  Input,
  Table,
  message,
  Popconfirm,
  Modal,
  Radio,
  InputNumber,
  Select,
  Tooltip,
  Divider,
  Cascader,
  DatePicker,
  Alert
} from "antd";
import RoleTree from "../../../../a_component/roleTree"; // 角色树 用于选角色

// ==================
// 本页面所需action
// ==================

import {
  findAdminUserByKeys,
  addAdminUserInfo,
  deleteAdminUserInfo,
  updateAdminUserInfo,
  findAllRole,
  findAllRoleByUserId,
  assigningRole,
  findAllOrganizer,
  findAllProvince,
  findCityOrCounty,
  findStationByArea
} from "../../../../a_action/sys-action";
import { findUserInfo, detailRecord } from "../../../../a_action/info-action";
import { onOk } from "../../../../a_action/shop-action";
// ==================
// Definition
// ==================
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { TextArea } = Input;
const Option = Select.Option;
class Manager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [], // 当前页面全部数据
      searchConditions: null,
      addnewModalShow: false, // 添加新用户 或 修改用户 模态框是否显示
      addnewLoading: false, // 是否正在添加新用户中
      nowData: null, // 当前选中用户的信息，用于查看详情
      orgCodeValue: null, // 新增、修改 - 选择的组织部门对象
      queryModalShow: false, // 查看详情模态框是否显示
      upModalShow: false, // 修改用户模态框是否显示
      extensionShow: false, //推广客户详情是否显示
      upLoading: false, // 是否正在修改用户中
      roleTreeShow: false, // 角色树是否显示
      pageNum: 1, // 当前第几页
      pageSize: 10, // 每页多少条
      total: 0, // 数据库总共多少条数据
      userId: "", // 获取用户id
      eId: "",
      addOrUp: "add", // 当前操作是新增还是修改
      citys: [], // 所有的省
      stations: [], // 当前服务站地区所对应的服务站
      searchBindingBeginTime: "", //搜索 - 开始绑定时间
      searchBindingEndTime: "", //搜搜 - 结束绑定时间
      searchAmbassadorUserType: "", //搜索 - 健康大使身份类型
    };
  }

  componentDidMount() {
    // 现在组织结构写死的，暂时不用，但接口保留
    // if((!this.props.allOrganizer) || (!this.props.allOrganizer.length)) {
    //     this.getAllOrganizer();
    // }
    if (!this.props.citys.length) {
      // 获取所有省，全局缓存
      this.getAllCity0();
    } else {
      this.setState({
        citys: this.props.citys.map((item, index) => ({
          id: item.id,
          value: item.areaName,
          label: item.areaName,
          isLeaf: false
        }))
      });
    }
    this.onGetData(this.state.pageNum, this.state.pageSize);
  }

  componentWillReceiveProps(nextP) {
    if (nextP.citys !== this.props.citys) {
      this.setState({
        citys: nextP.citys.map((item, index) => ({
          id: item.id,
          value: item.areaName,
          label: item.areaName,
          isLeaf: false
        }))
      });
    }
  }

  // 获取所有的省
  getAllCity0() {
    this.props.actions.findAllProvince();
  }

  // 根据上级区域找下级区域  获取省下面所有的市
  getAllCitySon(selectedOptions) {
    console.log("SSS", selectedOptions);
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;
    this.props.actions
      .findCityOrCounty({
        parentId: selectedOptions[selectedOptions.length - 1].id
      })
      .then(res => {
        if (res.returnCode === "0") {
          targetOption.children = res.messsageBody.map((item, index) => {
            return {
              id: item.id,
              value: item.areaName,
              label: item.areaName,
              isLeaf: item.level === 2,
              key: index
            };
          });
        }
        targetOption.loading = false;
        this.setState({
          citys: [...this.state.citys]
        });
      });
  }

  // 工具 - 根据ID获取用户类型
  getListByModelId(id) {
    switch (String(id)) {
      case "0":
        return "经销商（体验版）";
      case "1":
        return "经销商（微创版）";
      case "2":
        return "经销商（个人版）";
      case "3":
        return "分享用户";
      case "4":
        return "普通用户";
      case "5":
        return "企业版经销商";
      case "6":
        return "企业版子账号";
      case "7":
        return "分销商";
      default:
        return "";
    }
  }

  //工具 - 省市区的拼接
  getCity(s, c, q) {
    if (!s) {
      return "";
    }
    return `${s}${c}${q}`;
  }

    warning2 = () =>{
        message.warning('导出功能尚在开发 敬请期待');
    };

  // 查询当前页面所需列表数据
  onGetData(pageNum, pageSize) {
    const params = {
      pageNum,
      pageSize,
      category: 1,
      userName: this.state.searchUserName,
      conditions: this.state.searchConditions,
      userType: this.state.searchType,
      beginTime: this.state.searchBeginTime
        ? `${tools.dateToStrD(this.state.searchBeginTime._d)} 00:00:00`
        : "",
      endTime: this.state.searchEndTime
        ? `${tools.dateToStrD(this.state.searchEndTime._d)} 23:59:59 `
        : "",
      bindBeginTime: this.state.searchBindingBeginTime
        ? `${tools.dateToStrD(this.state.searchBindingBeginTime._d)} 00:00:00`
        : "",
      bindEndTime: this.state.searchBindingEndTime
        ? `${tools.dateToStrD(this.state.searchBindingEndTime._d)} 23:59:59`
        : ""
    };

    // this.props.actions.findUserInfo(tools.clearNull(params)).then(res => {
    //   if (res.status === 200) {
    //     this.setState({
    //       data: res.data.result || [],
    //       pageNum,
    //       pageSize,
    //       total: res.data.total
    //     });
    //   } else {
    //     message.error(res.returnMessaage || "获取数据失败，请重试");
    //   }
    // });
  }

  // 搜索
  onSearch() {
    this.onGetData(1, this.state.pageSize);
  }

  //Input中的删除按钮所删除的条件
  emitEmpty() {
    this.setState({
      searchEId: ""
    });
  }

  emitEmpty1() {
    this.setState({
      searchNickName: ""
    });
  }

  emitEmpty2() {
    this.setState({
      searchName: ""
    });
  }

  emitEmpty3() {
    this.setState({
      searchMobile: ""
    });
  }

  emitEmpty4() {
    this.setState({
      searchId: ""
    });
  }

  emitEmpty5() {
    this.setState({
      searchAmbassadorNickName: ""
    });
  }

  emitEmpty6() {
    this.setState({
      searchAmbassadorRealName: ""
    });
  }



  // 查看详情模态框关闭
  onQueryModalClose() {
    this.setState({
      queryModalShow: false
    });
  }

  // 搜索 - 开始时间变化
  searchBeginTime(v) {
    this.setState({
      searchBeginTime: v
    });
  }

  // 搜索 - 结束时间变化
  searchEndTime(v) {
    this.setState({
      searchEndTime: v
    });
  }

  //搜索 - 开始绑定时间
  searchBindingBeginTimeChange(v) {
    this.setState({
      searchBindingBeginTime: v
    });
    console.log("这是什么：", v);
  }

  //搜索 - 结束绑定时间
  searchBindingEndTimeChange(v) {
    this.setState({
      searchBindingEndTime: v
    });
  }

  //搜索 - 经销商账户
  onSearchUserName(e) {
    this.setState({
      searchUserName: e.target.value
    });
  }

  // 获取所有的省
  getAllCity0() {
    this.props.actions.findAllProvince();
  }

  // 获取某省下面的市
  getAllCitySon(selectedOptions) {
    console.log("SSS", selectedOptions);
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;
    this.props.actions
      .findCityOrCounty({
        parentId: selectedOptions[selectedOptions.length - 1].id
      })
      .then(res => {
        if (res.returnCode === "0") {
          targetOption.children = res.messsageBody.map((item, index) => {
            return {
              id: item.id,
              value: item.areaName,
              label: item.areaName,
              isLeaf: item.level === 2,
              key: index
            };
          });
        }
        targetOption.loading = false;
        this.setState({
          citys: [...this.state.citys]
        });
      });
  }

  // 表单页码改变
  onTablePageChange(page, pageSize) {
    console.log("页码改变：", page, pageSize);
    this.onGetData(page, pageSize);
  }

  // 构建字段
  makeColumns() {
    const columns = [
      {
        title: "序号",
        dataIndex: "serial",
        key: "serial"
      },
      {
        title: "优惠卡卡号",
      },
      {
        title: "领取人id",
      },
      {
        title: "领取人姓名",
      },
      {
        title: "领取人昵称",
      },
      {
        title: "领取人手机号",
      },
      {
        title: "领取时间",
      },
    ];
    return columns;
  }

  // 构建table所需数据
  makeData(data) {
    console.log("DATA:", data);
    if (!data) {
      return [];
    }
    return data.map((item, index) => {
      return {
        key: index,
        adminIp: item.adminIp,
        password: item.password,
        eId: item.id,
        citys:
          item.province && item.city && item.region
            ? `${item.province}/${item.city}/${item.region}`
            : "",
        serial: index + 1 + (this.state.pageNum - 1) * this.state.pageSize,
        age: item.age,
        conditions: item.conditions,
        creator: item.creator,
        createTime: item.createTime,
        description: item.description,
        email: item.email,
        orgCode: item.orgType,
        headImg: item.headImg,
        updateTime: item.updateTime,
        updater: item.updater,
        control: item.id,
        userId: item.eId,
        stationId: item.stationId,
        stationName: item.stationName,
        station: item.distributorAccount
          ? `${item.distributorAccount.province}${
              item.distributorAccount.city
            }${item.distributorAccount.region}`
          : "",
        province: item.province || "",
        city: item.city || "",
        region: item.region || "",
        nickName2: item.nickName,
        realName2: item.realName,
        mobile2: item.mobile,
        userType2: item.userType,
        userName2: item.userName,
        mid2: item.id,
        bindTime: item.bindTime,
        province2: item.distributorAccount
          ? item.distributorAccount.province
          : "",
        city2: item.distributorAccount ? item.distributorAccount.city : "",
        region2: item.distributorAccount ? item.distributorAccount.region : "",
        mid: item.distributorAccount ? item.distributorAccount.id : "",
        nickName: item.distributorAccount
          ? item.distributorAccount.nickName
          : "",
        realName: item.distributorAccount
          ? item.distributorAccount.realName
          : "",
        mobile: item.distributorAccount ? item.distributorAccount.mobile : "",
        userName: item.distributorAccount
          ? item.distributorAccount.userName
          : "",
        userType: item.distributorAccount
          ? item.distributorAccount.userType
          : ""
      };
    });
  }

  // 添加区域被改变  选择省市区后查询对应的服务站
  onAddCascader(e) {
    console.log("是什么:", e);
    const me = this;
    const { form } = me.props;
    form.resetFields(["addnewServiceStation", "upServiceStation"]);
    this.props.actions
      .findStationByArea({
        province: e[0],
        city: e[1],
        region: e[2],
        pageNum: 0,
        pageSize: 9999
      })
      .then(res => {
        if (res.returnCode === "0") {
          this.setState({
            stations: res.messsageBody.result
          });
        }
      });
  }

  render() {
    const me = this;
    const { form } = me.props;
    const { getFieldDecorator, getFieldValue } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    // console.log('code是什么：', addOrgCodeShow);

    const { searchEId } = this.state;
    const suffix = searchEId ? (
      <Icon type="close-circle" onClick={() => this.emitEmpty()} />
    ) : null;

    return (
      <div>
        <div className="top">
          <span style={{marginLeft:'20px',fontSize:'20px'}}>优惠卡统计</span>
          <Tooltip>
            <Icon
                type="left"
                style={{
                    color: "black",
                    marginTop: "5px",
                    marginLeft: "3px",
                    fontSize: "17px"
                }}
            />
          </Tooltip>
          <a href="#/usermanage/dealerinfo" style={{fontSize:'20px',color:'#798AE0',marginLeft:'5px',borderBottom:'2px solid #798AE0'}} >经销商信息管理</a>
        </div>
        <div className="system-search" style={{marginTop:'10px'}}>
          <ul className="search-ul" style={{ marginBottom: "10px" }}>
            <li>
              <span style={{ marginRight: "4px", marginLeft: "13px" }}>
                领取人id
              </span>
              <Input
                style={{ width: "172px" }}
                suffix={suffix}
                // value={searchEId}
                // onChange={e => this.onSearchEId(e)}
              />
            </li>
            <li>
              <span style={{ marginRight: "10px", marginLeft: "7px" }}>
                领取时间
              </span>
              <DatePicker
                  showTime={{ defaultValue: moment("00:00:00", "HH:mm:ss") }}
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="开始时间"
                  // onChange={e => this.searchBindingBeginTimeChange(e)}
                  onOk={onOk}
              />
              --
              <DatePicker
                  showTime={{ defaultValue: moment("23:59:59", "HH:mm:ss") }}
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="结束时间"
                  // onChange={e => this.searchBindingEndTimeChange(e)}
                  onOk={onOk}
              />
            </li>
            <li style={{ marginLeft: "5px" }}>
              <Button
                icon="search"
                type="primary"
                onClick={() => this.onSearch()}
              >
                搜索
              </Button>
            </li>
          </ul>
        </div>
        <div className="system-table" style={{ marginTop: "2px" }}>
          <Table
            columns={this.makeColumns()}
            dataSource={this.makeData(this.state.data)}
            pagination={{
              total: this.state.total,
              current: this.state.pageNum,
              pageSize: this.state.pageSize,
              showQuickJumper: true,
              showTotal: (total, range) => `共 ${total} 条数据`,
              onChange: (page, pageSize) =>
                this.onTablePageChange(page, pageSize)
            }}
          />
        </div>
      </div>
    );
  }
}

// ==================
// PropTypes
// ==================

Manager.propTypes = {
  location: P.any,
  history: P.any,
  actions: P.any,
  allRoles: P.any,
  allOrganizer: P.any,
  citys: P.array
};

// ==================
// Export
// ==================
const WrappedHorizontalManager = Form.create()(Manager);
export default connect(
  state => ({
    allRoles: state.sys.allRoles,
    allOrganizer: state.sys.allOrganizer,
    citys: state.sys.citys
  }),
  dispatch => ({
    actions: bindActionCreators(
      {
        findAdminUserByKeys,
        addAdminUserInfo,
        deleteAdminUserInfo,
        updateAdminUserInfo,
        findAllRole,
        findAllRoleByUserId,
        assigningRole,
        findAllOrganizer,
        findAllProvince,
        findCityOrCounty,
        findStationByArea,
        findUserInfo,
        onOk,
        detailRecord,
      },
      dispatch
    )
  })
)(WrappedHorizontalManager);
