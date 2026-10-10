const express = require('express');
const cors = require('cors');
const path = require('path');

const ordersRouter = require('./routes/orders');
const stationsRouter = require('./routes/stations');
const configRouter = require('./routes/config');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── 启动时校验必需环境变量 ─────────────────────────────────────
const required = ['DEEPSEEK_API_KEY'];
for (const k of required) {
  if (!process.env[k]) {
    console.warn(`⚠️ 缺少环境变量 ${k}（AI 派单将不可用，手动派单不受影响）`);
  }
}

// ─── 中间件 ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// 开发环境下直接托管前端静态文件（生产环境可换 nginx）
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API 路由 ────────────────────────────────────────────────────
app.use('/api/orders', ordersRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/config', configRouter);

// ─── API 404：JSON 而非 HTML ─────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// ─── 兜底：未匹配路由返回前端 index.html（SPA 支持） ────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── 统一错误处理（最后注册） ───────────────────────────────────
app.use(errorHandler);

// ─── 启动 ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ 家政速派后端已启动：http://localhost:${PORT}`);
  console.log(`   API 文档：docs/api.md`);
  console.log(`   GET    /api/orders              查询所有订单`);
  console.log(`   POST   /api/orders              创建新订单`);
  console.log(`   PUT    /api/orders/:id/dispatch 派单`);
  console.log(`   PUT    /api/orders/:id/complete 完结订单`);
  console.log(`   GET    /api/stations            查询所有站点`);
  console.log(`   GET    /api/stations/nearest    查询最近站点`);
  console.log(`   GET    /api/config              获取价格/类型配置\n`);
});
