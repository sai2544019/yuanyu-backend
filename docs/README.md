# 缘遇（Yuanyu）

> 温暖连接，遇见有趣灵魂。

一款面向 18-30 岁都市年轻人的移动社交应用，主打兴趣驱动 + 真实社交。

## 仓库说明

本仓库为**缘遇**项目的前后端分离架构中的**后端服务**。

| 仓库 | 说明 |
|------|------|
| [yuanyu-backend](https://github.com/sai2544019/yuanyu-backend) | 后端服务（Node.js + Express + TypeScript） |
| [yuanyu-mobile](https://github.com/sai2544019/yuanyu-mobile) | 移动端应用（React + Vite + TypeScript） |

## 技术架构

```
┌─────────────────────────────┐
│      移动端 Web App         │
│   React + Zustand + Axios   │
└──────────┬──────────────────┘
           │  HTTP / REST
           ▼
┌─────────────────────────────┐
│      后端 API 服务           │
│  Node.js + Express + TS     │
└──────────┬──────────────────┘
           │  开发环境
           ▼
┌─────────────────────────────┐
│      内存数据库（开发）       │
│   PostgreSQL + Redis（生产）  │
└─────────────────────────────┘
```

## 技术栈

**后端：** Node.js · Express · TypeScript · JWT · In-memory DB（开发） · PostgreSQL + Prisma（生产）· Redis（生产）

**前端：** React 19 · Vite · TypeScript · React Router v7 · Zustand · Axios

## 核心功能

- **滑动匹配** — 卡片式浏览，超级喜欢，双向喜欢即匹配
- **即时聊天** — 消息气泡，撤回，已读状态
- **兴趣社群** — 分类浏览，发布活动，成员管理
- **发现推荐** — 性别偏好筛选 / 附近的人 / 真心话问答

## 快速启动

**后端：**
```bash
cd yuanyu-backend
npm install
npm run dev
# 服务运行在 http://localhost:3000
```

**前端：**
```bash
cd yuanyu-mobile
npm install
npm run dev
# 应用运行在 http://localhost:8081
```

## 产品文档

- [产品设计](./PRODUCT.md) — 功能架构、用户流程、UI 规范
- [接口文档](./API.md) — 所有 API 端点详细说明

## 项目进度

### ✅ 已完成

- [x] 产品设计文档（8份设计文档）
- [x] 项目脚手架搭建
- [x] 登录/注册（昵称模式）
- [x] 发现页滑动卡片
- [x] 用户资料管理
- [x] 匹配系统
- [x] 即时聊天
- [x] 消息列表
- [x] 社群浏览
- [x] 社群详情
- [x] 个人资料页
- [x] API 接口文档
- [x] Git 仓库初始化

### 🔄 进行中

- [ ] 完善资料引导页（Onboarding）— 头像、性别、城市设置
- [ ] 超级喜欢功能
- [ ] 位置权限获取
- [ ] 图片上传

### 📋 待开发

- [ ] 启动页 / 闪屏
- [ ] 消息推送通知
- [ ] 社群里发帖/评论
- [ ] 活动报名与日历
- [ ] VIP 会员体系
- [ ] 后台管理系统
- [ ] 单元测试 / E2E 测试
- [ ] PostgreSQL + Redis 持久化

## License

ISC
