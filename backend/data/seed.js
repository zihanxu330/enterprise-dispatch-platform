// ─── 初始数据 ─────────────────────────────────────────────────────

const stations = [
  {
    id: 'ST01',
    name: '银川兴庆区家政服务站',
    addr: '宁夏银川市兴庆区解放西街168号',
    lng: 106.2309,
    lat: 38.4872,
    workers: [
      { id: 'W01', name: '李美华', rating: 4.9, orders: 312, skill: '标准保洁', status: 'available' },
      { id: 'W02', name: '王建国', rating: 4.8, orders: 208, skill: '搬家整理', status: 'available' },
      { id: 'W03', name: '张玉兰', rating: 5.0, orders: 156, skill: '高端育儿', status: 'busy' },
    ],
  },
  {
    id: 'ST02',
    name: '银川金凤区旗舰服务中心',
    addr: '宁夏银川市金凤区北京中路388号',
    lng: 106.1706,
    lat: 38.5026,
    workers: [
      { id: 'W04', name: '陈桂芳', rating: 4.9, orders: 445, skill: '全屋深洁', status: 'available' },
      { id: 'W05', name: '刘大强', rating: 4.7, orders: 178, skill: '家电清洗', status: 'available' },
    ],
  },
  {
    id: 'ST03',
    name: '银川西夏区便民家政站',
    addr: '宁夏银川市西夏区怀远西路520号',
    lng: 106.0918,
    lat: 38.5183,
    workers: [
      { id: 'W06', name: '马秀英', rating: 4.8, orders: 267, skill: '标准保洁', status: 'available' },
      { id: 'W07', name: '丁志远', rating: 4.6, orders: 134, skill: '养老陪护', status: 'available' },
      { id: 'W08', name: '韩冬梅', rating: 4.9, orders: 198, skill: '月嫂护理', status: 'available' },
    ],
  },
];

let orders = [
  {
    id: 'CS20268801',
    type: '深度清洁',
    typeKey: 'deep',
    addr: '银川市兴庆区富宁街小区',
    station: 'ST01',
    worker: 'W01',
    status: 'enroute',
    date: '今日',
    time: '09:00–12:00',
    price: 368,
    note: '',
    phone: '138****9900',
    created: '08:32',
  },
  {
    id: 'CS20268802',
    type: '日常保洁',
    typeKey: 'daily',
    addr: '银川市金凤区阅海湾住宅区',
    station: 'ST02',
    worker: 'W04',
    status: 'done',
    date: '今日',
    time: '13:00–16:00',
    price: 198,
    note: '',
    phone: '139****1122',
    created: '07:15',
  },
];

const priceMap = {
  daily: 198,
  deep: 368,
  appliance: 280,
  moving: 480,
  nanny: 580,
  elderly: 420,
};

const typeNames = {
  daily: '日常保洁',
  deep: '深度清洁',
  appliance: '家电清洗',
  moving: '搬家整理',
  nanny: '月嫂护理',
  elderly: '养老陪护',
};

module.exports = { stations, orders, priceMap, typeNames };
