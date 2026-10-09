# 家政速派调度系统（jiajia）

家政服务智能派单系统：用户在网页下单，系统调用 **DeepSeek AI 引擎** 结合站点距离、工人评分、技能匹配度，自动为订单选择最优站点和工人完成派单。

## 技术栈

- **后端**：Node.js + Express（端口 3000）
- **前端**：纯静态 HTML + JavaScript（fetch 调用后端 API）
- **AI 派单**：DeepSeek API（`deepseek-chat`，低温度确保稳定输出）
- **地图**：高德地图（定位、最近站点查询）

## 项目结构

```
jiajia/
├── backend/                  ← Node.js + Express 后端
│   ├── server.js             ← 主入口，端口 3000
│   ├── package.json
│   ├── data/seed.js          ← 初始数据（站点、订单、价格表）
│   ├── routes/
│   │   ├── orders.js         ← 订单 CRUD + 派单
│   │   ├── stations.js       ← 站点查询 + 最近站点
│   │   └── config.js         ← 价格表、服务类型
│   └── services/deepseek.js  ← AI 派单引擎（API Key 从环境变量读取）
├── frontend/                 ← 纯静态前端
│   ├── index.html            ← UI 结构 + CSS
│   └── app.js                ← 交互逻辑（fetch 调用 API）
└── signature/                ← 附加：jiajia 签名动画作品（HTML 小样）
```

## 快速启动

### 1. 配置环境变量

```bash
cd backend
copy ..\.env.example .env   # Windows
# 或 cp ../.env.example .env  (Linux/macOS)
```

编辑 `.env`，填入你的 DeepSeek API Key；打开 `frontend/app.js`，将高德 Key 替换为你自己的。

### 2. 安装并启动后端

```bash
cd backend
npm install
npm start
# 或开发模式（自动重启）：
npm run dev
```

后端启动后控制台会打印：`✅ 家政速派后端已启动：http://localhost:3000`

### 3. 打开前端

直接用浏览器打开 `frontend/index.html`，或访问后端托管的地址 `http://localhost:3000`

## API 接口一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/orders | 获取所有订单 |
| POST | /api/orders | 创建新订单 |
| PUT | /api/orders/:id/dispatch | 派单给工人 |
| PUT | /api/orders/:id/complete | 完结订单 |
| GET | /api/stations | 获取所有站点 |
| GET | /api/stations/nearest?lat=&lng= | 查询最近站点 |
| GET | /api/config | 获取价格/类型 |

## 功能说明

- **AI 智能派单**：根据订单信息（类型、地址、时间）+ 候选站点（距离、ETA、工人评分/技能/完单数），由 DeepSeek 选出最优站点和工人，并返回派单理由
- **站点管理**：多站点就近服务，查询客户最近站点
- **订单全流程**：下单 → 派单 → 完成

## V5 规划（单系统多角色）

- **user（用户）**：下单、进行中订单、我的订单
- **station（站点）**：待接订单、已接订单、服务师管理、订单进度
- **enterprise（企业）**：运营大屏、AI 派单中心、站点管理、服务师管理、统计分析

## 说明

- API Key 均通过环境变量注入，`.env` 已被 git 忽略，请勿提交真实 Key
- 数据默认存储在内存（`data/seed.js`），如需持久化可替换为 MongoDB / MySQL
