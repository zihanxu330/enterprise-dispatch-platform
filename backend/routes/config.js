const express = require('express');
const router = express.Router();
const { priceMap, typeNames } = require('../data/seed');

// ─── GET /api/config  →  返回价格表和服务类型 ────────────────────
router.get('/', (req, res) => {
  res.json({ priceMap, typeNames });
});

module.exports = router;
