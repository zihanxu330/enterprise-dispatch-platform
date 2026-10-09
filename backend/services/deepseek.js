// ─── DeepSeek API 封装 ───────────────────────────────────────────
// API Key 从环境变量读取，勿硬编码在代码中。配置方式见项目根目录 .env.example
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

/**
 * 调用 DeepSeek，让 AI 从多个候选站点中选出最优站点和工人
 * @param {object} order - 订单信息
 * @param {Array}  stationsWithDistance - 每个站点附加了 distanceKm 字段
 * @returns {object} { stationId, workerId, reason }
 */
async function pickBestDispatch(order, stationsWithDistance) {
  const prompt = `
你是一个家政调度系统的智能派单引擎。请根据以下信息，选出最合适的站点和工人来服务这个订单。

【订单信息】
- 服务类型：${order.type}
- 服务地址：${order.addr}
- 预约时间：${order.date} ${order.time}
- 备注：${order.note || '无'}

【候选站点列表】
${stationsWithDistance.map(s => `
站点ID: ${s.id}
站点名称: ${s.name}
距离客户: ${s.distanceKm} km（预计 ${s.etaMinutes} 分钟到达）
可用工人:
${s.workers.filter(w => w.status === 'available').map(w =>
  `  - 工人ID: ${w.id}，姓名: ${w.name}，评分: ${w.rating}，完单数: ${w.orders}，擅长: ${w.skill}`
).join('\n') || '  暂无可用工人'}
`).join('\n---')}

【选择标准】
1. 优先选距离最近的站点（节省时间）
2. 同等距离下选评分最高的工人
3. 工人技能要与服务类型匹配（如深度清洁优先选擅长全屋深洁的）
4. 只能选 status 为 available 的工人

请严格返回如下 JSON 格式，不要有任何多余文字：
{
  "stationId": "站点ID",
  "workerId": "工人ID",
  "reason": "简短的派单理由（30字以内）"
}
`;

  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2, // 低温度确保稳定输出
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API 错误: ${err}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();

  // 安全解析 JSON（兼容 DeepSeek 可能带 ```json``` 的情况）
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { pickBestDispatch };
