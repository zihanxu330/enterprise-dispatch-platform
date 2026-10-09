const express = require('express');
const router = express.Router();
const { stations } = require('../data/seed');

// ─── Haversine 距离计算（保留备用） ─────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GET /api/stations  →  返回所有站点（含员工列表） ────────────
router.get('/', (req, res) => {
  res.json(stations);
});

// ─── GET /api/stations/nearest  →  计算各站点距离并返回，供 AI 使用 ──
router.get('/nearest', (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: '缺少 lat/lng 参数' });

  // 计算所有站点的距离，附加到数据里一并返回
  const stationsWithDistance = stations.map(s => {
    const d = haversine(parseFloat(lat), parseFloat(lng), s.lat, s.lng);
    const avail = s.workers.filter(w => w.status === 'available').length;
    return {
      ...s,
      distanceKm: parseFloat(d.toFixed(1)),
      etaMinutes: Math.max(8, Math.round(d / 0.25)),
      availableWorkers: avail,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  // 返回最近站点 + 全部站点距离数据（供 AI 派单使用）
  const best = stationsWithDistance[0];
  res.json({
    station: best,
    distanceKm: best.distanceKm,
    etaMinutes: best.etaMinutes,
    availableWorkers: best.availableWorkers,
    allStations: stationsWithDistance, // AI 派单时用这个
  });
});

module.exports = router;
