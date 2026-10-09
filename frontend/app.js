const API_BASE = 'http://localhost:3000/api';
// 高德地图 Key：替换为你自己的 Key（https://lbs.amap.com）
const AMAP_KEY = '你的高德Key';

let priceMap = {}, typeNames = {}, stations = [], _nearestStation = null;
let map = null, geocoder = null, marker = null, amapLoaded = false;

// ── API ────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'HTTP ' + res.status);
  }
  return res.json();
}

// ── Toast ──────────────────────────────────────────────────────
function toast(msg, dur) {
  dur = dur || 2600;
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.classList.remove('show'); }, dur);
}

// ── Init ───────────────────────────────────────────────────────
async function init() {
  try {
    const cfg = await api('/config');
    priceMap = cfg.priceMap;
    typeNames = cfg.typeNames;
    document.getElementById('svc-date').valueAsDate = new Date(Date.now() + 86400000);
    await refreshBadge();
    loadAmap();
  } catch (e) {
    toast('后端连接失败，请启动服务器');
  }
}

// ── Map ────────────────────────────────────────────────────────
function loadAmap() {
  if (amapLoaded) return;
  amapLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://webapi.amap.com/maps?v=2.0&key=' + AMAP_KEY + '&callback=initMap';
  document.head.appendChild(s);
}

window.initMap = function() {
  map = new AMap.Map('amap', { zoom: 13, center: [106.1706, 38.5026] });
  AMap.plugin(['AMap.Geocoder', 'AMap.Geolocation'], function() {
    geocoder = new AMap.Geocoder({ radius: 1000 });
    map.on('click', function(e) { pinLocation(e.lnglat); expandForm(); });
  });
  document.getElementById('map-hint').style.display = 'none';
  simulateLocation();
};

function pinLocation(lnglat) {
  if (marker) map.remove(marker);
  marker = new AMap.Marker({ position: lnglat, map: map });
  map.panTo(lnglat);
  map.setZoom(15);
  var lat = lnglat.lat || lnglat[1];
  var lng = lnglat.lng || lnglat[0];
  fetchNearest(lat, lng);
}

async function fetchNearest(lat, lng) {
  try {
    const r = await api('/stations/nearest?lat=' + lat + '&lng=' + lng);
    _nearestStation = r.station;
    document.getElementById('nearest-name').textContent = r.station.name;
    document.getElementById('nearest-meta').textContent = '距您 ' + r.distanceKm + ' km · 预计 ' + r.etaMinutes + ' 分钟上门';
    document.getElementById('nearest-avail').textContent = r.availableWorkers + ' 名服务师空闲待命';
  } catch(e) {
    document.getElementById('nearest-name').textContent = '站点加载失败';
  }
}

function simulateLocation() {
  var lat = 38.5026 + (Math.random() - 0.5) * 0.02;
  var lng = 106.1706 + (Math.random() - 0.5) * 0.02;
  fetchNearest(lat, lng);
}

function locateUser() {
  if (!map) { loadAmap(); setTimeout(locateUser, 800); return; }
  var geo = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 5000 });
  geo.getCurrentPosition(function(status, result) {
    if (status === 'complete') pinLocation(result.position);
    else simulateLocation();
  });
}

function onAddrInput(v) {
  if (!v || !geocoder) return;
  geocoder.getLocation(v, function(status, result) {
    if (status === 'complete' && result.geocodes.length > 0) {
      pinLocation(result.geocodes[0].location);
    }
  });
}

// ── Form ───────────────────────────────────────────────────────
function expandForm() {
  document.getElementById('order-fields').classList.add('open');
}

function onTypeChange() {
  var t = document.getElementById('svc-type').value;
  document.getElementById('price-num').textContent = priceMap[t] || 198;
  document.getElementById('price-type').textContent = typeNames[t] || '';
}

// ── Tabs ───────────────────────────────────────────────────────
var TABS = ['order', 'dispatch', 'track', 'station'];

function switchTab(t) {
  TABS.forEach(function(n, i) {
    document.querySelectorAll('.nav-btn')[i].classList.toggle('active', n === t);
    document.getElementById('panel-' + n).classList.toggle('active', n === t);
  });
  if (t === 'dispatch') renderDispatch();
  if (t === 'track') renderTrack();
  if (t === 'station') renderStations();
  refreshBadge();
}

// ── Badge ──────────────────────────────────────────────────────
async function refreshBadge() {
  try {
    const orders = await api('/orders');
    const n = orders.filter(function(o) { return o.status === 'pending'; }).length;
    document.getElementById('pending-dot').classList.toggle('show', n > 0);
    document.getElementById('s-pending').textContent = n;
    document.getElementById('s-active').textContent = orders.filter(function(o) { return o.status === 'enroute'; }).length;
    document.getElementById('s-done').textContent = orders.filter(function(o) { return o.status === 'done'; }).length;
  } catch(e) {}
}

// ── Submit ─────────────────────────────────────────────────────
async function submitOrder() {
  var type = document.getElementById('svc-type').value;
  var addr = document.getElementById('addr-input').value || '银川（定位点）';
  try {
    const o = await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        type: type,
        addr: addr,
        phone: document.getElementById('svc-phone').value,
        note: document.getElementById('svc-note').value,
        date: document.getElementById('svc-date').value || '今日',
        time: document.getElementById('svc-time').value,
        stationId: _nearestStation ? _nearestStation.id : 'ST01',
      }),
    });
    await refreshBadge();
    toast('订单 ' + o.id + ' 已提交，AI 正在派单');
    document.getElementById('order-fields').classList.remove('open');
    document.getElementById('addr-input').value = '';
    setTimeout(function() { switchTab('track'); }, 800);
  } catch(e) {
    toast('下单失败：' + e.message);
  }
}

// ── Status ─────────────────────────────────────────────────────
var SC = {
  pending:   { label: '待派单', cls: 'b-pending' },
  enroute:   { label: '服务中', cls: 'b-enroute' },
  done:      { label: '已完成', cls: 'b-done' },
  cancelled: { label: '已取消', cls: 'b-cancelled' },
};

function badge(s) {
  var c = SC[s] || { label: s, cls: 'b-done' };
  return '<span class="badge ' + c.cls + '">' + c.label + '</span>';
}

// ── Dispatch ───────────────────────────────────────────────────
async function renderDispatch() {
  try {
    const orders = await api('/orders');
    const sts = await api('/stations');
    stations = sts;
    const pending = orders.filter(function(o) { return o.status === 'pending'; });
    const active  = orders.filter(function(o) { return o.status === 'enroute'; });

    if (pending.length === 0) {
      document.getElementById('dispatch-pending').innerHTML = '<div class="empty"><div class="empty-icon">✅</div><div class="empty-txt">暂无待派单订单</div></div>';
    } else {
      document.getElementById('dispatch-pending').innerHTML = pending.map(function(o) {
        var st = stations.find(function(s) { return s.id === o.station; }) || stations[0];
        var avail = (st ? st.workers : []).filter(function(w) { return w.status === 'available'; });
        return '<div class="card" style="cursor:default">' +
          '<div class="card-hd"><div><div class="card-title">' + o.type + '</div><div class="card-sub">' + o.addr + '</div></div>' + badge('pending') + '</div>' +
          avail.slice(0,2).map(function(w) {
            return '<hr class="card-divider"><div class="worker">' +
              '<div class="w-avatar">' + w.name[0] + '</div>' +
              '<div><div class="w-name">' + w.name + '</div><div class="w-meta">★' + w.rating + ' · ' + w.orders + '单 · ' + w.skill + '</div></div>' +
              '<button class="assign-btn" onclick="doDispatch(\'' + o.id + '\',\'' + w.id + '\')">指派</button></div>';
          }).join('') +
          '</div>';
      }).join('');
    }

    document.getElementById('dispatch-active').innerHTML = active.length
      ? active.map(function(o) {
          return '<div class="card" onclick="showDetail(\'' + o.id + '\')">' +
            '<div class="card-hd"><div><div class="card-title">' + o.type + '</div><div class="card-sub">' + o.addr + '</div></div>' + badge('enroute') + '</div>' +
            '<div class="card-meta">' + o.date + ' ' + o.time + ' · ¥' + o.price + '</div></div>';
        }).join('')
      : '<div style="font-size:13px;color:var(--ink3);padding:8px 0">暂无进行中服务</div>';
  } catch(e) {
    document.getElementById('dispatch-pending').innerHTML = '<div class="empty"><div class="empty-txt">加载失败，检查后端连接</div></div>';
  }
}

async function doDispatch(orderId, workerId) {
  try {
    const r = await api('/orders/' + orderId + '/dispatch', {
      method: 'PUT',
      body: JSON.stringify({ workerId: workerId }),
    });
    toast('已指派给 ' + r.worker.name);
    await refreshBadge();
    renderDispatch();
  } catch(e) {
    toast('派单失败：' + e.message);
  }
}

// ── Track ──────────────────────────────────────────────────────
async function renderTrack() {
  try {
    const orders = await api('/orders');
    document.getElementById('track-list').innerHTML = orders.length
      ? orders.map(function(o) {
          var stars = o.rating ? ' · ' + '★'.repeat(o.rating) + '☆'.repeat(5 - o.rating) : '';
          return '<div class="card" onclick="showDetail(\'' + o.id + '\')">' +
            '<div class="card-hd"><div><div class="card-title">' + o.type + '</div><div class="card-sub">' + o.id + '</div></div>' + badge(o.status) + '</div>' +
            '<div class="card-meta">📍 ' + o.addr + '</div>' +
            '<div class="card-meta">' + o.date + ' ' + o.time + ' · <strong style="color:var(--ink)">¥' + o.price + '</strong>' + stars + '</div>' +
            '</div>';
        }).join('')
      : '<div class="empty"><div class="empty-icon">📋</div><div class="empty-txt">暂无订单记录</div></div>';
  } catch(e) {
    document.getElementById('track-list').innerHTML = '<div class="empty"><div class="empty-txt">加载失败</div></div>';
  }
}

// ── Stations ───────────────────────────────────────────────────
async function renderStations() {
  try {
    const sts = await api('/stations');
    document.getElementById('station-list').innerHTML = sts.map(function(s) {
      var avail = s.workers.filter(function(w) { return w.status === 'available'; }).length;
      return '<div class="station-card">' +
        '<div class="st-hd"><div class="st-name">' + s.name + '</div><span class="badge b-enroute">' + avail + ' 人空闲</span></div>' +
        '<div class="st-addr">' + s.addr + '</div>' +
        s.workers.map(function(w) {
          return '<div class="w-item">' +
            '<div class="w-dot ' + (w.status === 'available' ? 'on' : 'off') + '"></div>' +
            '<div class="w-sm-avatar">' + w.name[0] + '</div>' +
            '<div style="flex:1"><div style="font-size:13px;font-weight:500">' + w.name + '</div>' +
            '<div style="font-size:11px;color:var(--ink3)">' + w.skill + ' · ★' + w.rating + '</div></div>' +
            '<div style="font-size:11px;color:' + (w.status === 'available' ? 'var(--green)' : 'var(--ink3)') + '">' + (w.status === 'available' ? '空闲' : '忙碌') + '</div>' +
            '</div>';
        }).join('') +
        '</div>';
    }).join('');
  } catch(e) {
    document.getElementById('station-list').innerHTML = '<div class="empty"><div class="empty-txt">加载失败</div></div>';
  }
}

// ── Detail sheet ───────────────────────────────────────────────
var stepsCfg = [
  { key: 'pending', label: '下单' },
  { key: 'enroute', label: '服务中' },
  { key: 'done',    label: '已完成' },
];

var _selectedRating = 0;

async function showDetail(orderId) {
  try {
    const orders = await api('/orders');
    const sts = await api('/stations');
    const o = orders.find(function(x) { return x.id === orderId; });
    if (!o) return;

    var worker = sts.flatMap(function(s) { return s.workers; }).find(function(w) { return w.id === o.worker; });

    var stepIdx = stepsCfg.findIndex(function(s) { return s.key === o.status; });
    var trackHtml = o.status !== 'cancelled'
      ? '<div class="track-steps">' + stepsCfg.map(function(s, i) {
          return '<div class="step">' +
            '<div class="step-line ' + (i < stepIdx ? 'done' : '') + '"></div>' +
            '<div class="step-dot ' + (i < stepIdx ? 'done' : i === stepIdx ? 'active' : '') + '"></div>' +
            '<div class="step-label ' + (i < stepIdx ? 'done' : i === stepIdx ? 'active' : '') + '">' + s.label + '</div>' +
            '</div>';
        }).join('') + '</div>'
      : '<div style="margin:12px 0"><span class="badge b-cancelled">已取消 · ' + (o.cancelReason || '') + '</span></div>';

    var aiHtml = o.aiDispatch && o.aiReason
      ? '<div class="ai-banner"><div class="ai-banner-title">🤖 AI 智能派单</div><div class="ai-banner-body">' + o.aiReason + '</div></div>'
      : '';

    var reviewHtml = '';
    if (o.status === 'done' && !o.rating) {
      reviewHtml = '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:10px">为本次服务评分</div>' +
        '<div class="stars" id="star-row">' +
        [1,2,3,4,5].map(function(n) { return '<span class="star" onclick="selectStar(' + n + ')">★</span>'; }).join('') +
        '</div>' +
        '<textarea class="form-ctrl" id="review-text" style="margin-top:10px" placeholder="分享本次服务体验（选填）…"></textarea>' +
        '<button class="cta" style="margin-top:10px" onclick="submitReview(\'' + o.id + '\')">提交评价</button>' +
        '</div>';
    } else if (o.rating) {
      reviewHtml = '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:6px">我的评价</div>' +
        '<div style="color:#f59e0b;font-size:20px">' + '★'.repeat(o.rating) + '☆'.repeat(5 - o.rating) + '</div>' +
        (o.review ? '<div style="font-size:13px;color:var(--ink2);margin-top:6px">' + o.review + '</div>' : '') +
        '</div>';
    }

    var cancelHtml = o.status === 'pending'
      ? '<button class="cta outline" style="margin-top:10px" onclick="cancelOrder(\'' + o.id + '\')">取消订单</button>'
      : '';

    document.getElementById('sheet-body').innerHTML =
      '<div style="margin-top:12px">' +
      '<div class="sheet-title">' + o.type + '</div>' +
      '<div style="font-size:12px;color:var(--ink3);margin-top:2px">' + o.id + '</div>' +
      '</div>' +
      trackHtml + aiHtml +
      '<div style="margin-top:4px">' +
      '<div class="info-row"><span class="info-key">服务地址</span><span class="info-val">' + o.addr + '</span></div>' +
      '<div class="info-row"><span class="info-key">预约时间</span><span class="info-val">' + o.date + ' ' + o.time + '</span></div>' +
      '<div class="info-row"><span class="info-key">联系电话</span><span class="info-val">' + (o.phone || '—') + '</span></div>' +
      '<div class="info-row"><span class="info-key">服务费用</span><span class="info-val" style="font-weight:700">¥' + o.price + '</span></div>' +
      (worker ? '<div class="info-row"><span class="info-key">服务人员</span><span class="info-val">' + worker.name + ' ★' + worker.rating + '</span></div>' : '') +
      (o.note ? '<div class="info-row"><span class="info-key">备注</span><span class="info-val">' + o.note + '</span></div>' : '') +
      '<div class="info-row"><span class="info-key">派单方式</span><span class="info-val">' + (o.aiDispatch ? 'AI 自动派单' : '人工派单') + '</span></div>' +
      '</div>' +
      reviewHtml + cancelHtml;

    document.getElementById('overlay').classList.add('show');
  } catch(e) {
    toast('加载失败');
  }
}

function selectStar(n) {
  _selectedRating = n;
  var stars = document.querySelectorAll('#star-row .star');
  stars.forEach(function(el, i) { el.classList.toggle('lit', i < n); });
}

async function submitReview(orderId) {
  if (!_selectedRating) { toast('请先选择星级'); return; }
  try {
    var reviewText = document.getElementById('review-text');
    await api('/orders/' + orderId + '/review', {
      method: 'POST',
      body: JSON.stringify({ rating: _selectedRating, review: reviewText ? reviewText.value : '' }),
    });
    toast('感谢您的评价');
    _selectedRating = 0;
    closeSheet();
    renderTrack();
  } catch(e) {
    toast('提交失败：' + e.message);
  }
}

async function cancelOrder(orderId) {
  if (!confirm('确认取消此订单？')) return;
  try {
    await api('/orders/' + orderId, {
      method: 'DELETE',
      body: JSON.stringify({ reason: '用户主动取消' }),
    });
    toast('订单已取消');
    closeSheet();
    await refreshBadge();
    renderTrack();
  } catch(e) {
    toast('取消失败：' + e.message);
  }
}

// ── Sheet ──────────────────────────────────────────────────────
function closeSheet(e) {
  if (e && e.target !== document.getElementById('overlay')) return;
  document.getElementById('overlay').classList.remove('show');
}

init();
