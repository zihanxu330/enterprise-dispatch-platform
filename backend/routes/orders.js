const express = require('express');
const router = express.Router();
const { orders, stations, priceMap, typeNames } = require('../data/seed');
const { pickBestDispatch } = require('../services/deepseek');

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// GET /api/orders
router.get('/', (req, res) => res.json(orders));

// POST /api/orders — 创建订单 + AI 自动派单
router.post('/', async (req, res) => {
  const { type, addr, phone, note, date, time, lat, lng } = req.body;
  if (!type || !addr) return res.status(400).json({ error: '服务类型和地址为必填项' });

  const id = 'CS' + Date.now() + Math.floor(Math.random() * 1000);
  const newOrder = {
    id, type: typeNames[type] || type, typeKey: type,
    addr, station: '', worker: '', status: 'pending',
    date: date || '今日', time: time || '',
    price: priceMap[type] || 0, note: note || '', phone: phone || '',
    created: new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }),
    aiReason: '', aiDispatch: false,
    rating: null, review: '', cancelReason: '',
  };

  orders.unshift(newOrder);
  res.status(201).json(newOrder);

  // AI 派单（后台异步）
  try {
    const userLat = parseFloat(lat) || 38.5026;
    const userLng = parseFloat(lng) || 106.1706;
    const stationsWithDistance = stations.map(s => ({
      ...s,
      distanceKm: parseFloat(haversine(userLat, userLng, s.lat, s.lng).toFixed(1)),
      etaMinutes: Math.max(8, Math.round(haversine(userLat, userLng, s.lat, s.lng) / 0.25)),
    }));
    console.log(`\n🤖 [AI派单] 订单 ${id} 调用 DeepSeek...`);
    const result = await pickBestDispatch(newOrder, stationsWithDistance);
    console.log(`✅ [AI派单]`, result);
    const chosenStation = stations.find(s => s.id === result.stationId);
    const chosenWorker = stations.flatMap(s => s.workers).find(w => w.id === result.workerId);
    if (chosenStation && chosenWorker && chosenWorker.status === 'available') {
      newOrder.station = result.stationId;
      newOrder.worker = result.workerId;
      newOrder.status = 'enroute';
      newOrder.aiReason = result.reason;
      newOrder.aiDispatch = true;
      chosenWorker.status = 'busy';
      console.log(`📋 指派 → ${chosenStation.name} / ${chosenWorker.name}`);
    }
  } catch (e) {
    console.error(`❌ [AI派单] 失败:`, e.message);
  }
});

// PUT /api/orders/:id/dispatch — 手动派单
router.put('/:id/dispatch', (req, res) => {
  const { workerId } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.status !== 'pending') return res.status(400).json({ error: '该订单已处理' });
  const worker = stations.flatMap(s => s.workers).find(w => w.id === workerId);
  if (!worker) return res.status(404).json({ error: '工人不存在' });
  if (worker.status !== 'available') return res.status(400).json({ error: '该工人当前不可用' });
  order.worker = workerId;
  order.status = 'enroute';
  order.aiDispatch = false;
  worker.status = 'busy';
  res.json({ order, worker });
});

// PUT /api/orders/:id/complete — 完结订单
router.put('/:id/complete', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  order.status = 'done';
  if (order.worker) {
    const worker = stations.flatMap(s => s.workers).find(w => w.id === order.worker);
    if (worker) worker.status = 'available';
  }
  res.json(order);
});

// DELETE /api/orders/:id — 取消订单
router.delete('/:id', (req, res) => {
  const { reason } = req.body;
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '订单不存在' });
  const order = orders[idx];
  if (order.status !== 'pending') return res.status(400).json({ error: '只能取消待派单的订单' });
  order.status = 'cancelled';
  order.cancelReason = reason || '用户取消';
  if (order.worker) {
    const worker = stations.flatMap(s => s.workers).find(w => w.id === order.worker);
    if (worker) worker.status = 'available';
  }
  res.json(order);
});

// POST /api/orders/:id/review — 提交评价
router.post('/:id/review', (req, res) => {
  const { rating, review } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.status !== 'done') return res.status(400).json({ error: '只能评价已完成的订单' });
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: '评分须在 1-5 之间' });
  order.rating = rating;
  order.review = review || '';
  // 更新工人平均评分
  if (order.worker) {
    const worker = stations.flatMap(s => s.workers).find(w => w.id === order.worker);
    if (worker) {
      const workerOrders = orders.filter(o => o.worker === order.worker && o.rating);
      const avg = workerOrders.reduce((s, o) => s + o.rating, 0) / workerOrders.length;
      worker.rating = parseFloat(avg.toFixed(1));
    }
  }
  res.json(order);
});

module.exports = router;
