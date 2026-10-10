# API Reference

Base URL: `http://localhost:3000`

## Overview

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /api/orders | no | List all orders |
| POST | /api/orders | no | Create an order (triggers async AI dispatch) |
| PUT | /api/orders/:id/dispatch | no | Manually dispatch an order to a worker |
| PUT | /api/orders/:id/complete | no | Mark an order as completed |
| DELETE | /api/orders/:id | no | Cancel a pending order |
| POST | /api/orders/:id/review | no | Rate a completed order (1-5) |
| GET | /api/stations | no | List all stations with workers |
| GET | /api/stations/nearest | no | Find nearest station by lat/lng |
| GET | /api/config | no | Get pricing & service types |

All responses are JSON. Errors use `{ "error": "<message>" }` with an appropriate HTTP status.

---

## GET /api/orders

List all orders (newest first).

**Response 200**

```json
[
  {
    "id": "CS1712000000123",
    "type": "深度清洁",
    "typeKey": "deep_clean",
    "addr": "银川市金凤区XX路",
    "station": "ST01",
    "worker": "WK03",
    "status": "enroute",
    "date": "今日",
    "time": "14:00",
    "price": 399,
    "note": "",
    "phone": "",
    "created": "13:45",
    "aiReason": "距离最近且工人评分最高",
    "aiDispatch": true,
    "rating": null,
    "review": "",
    "cancelReason": ""
  }
]
```

---

## POST /api/orders

Create a new order. After responding `201`, the server asynchronously calls DeepSeek to auto-dispatch.

**Request Body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| type | string | yes | Service type key (e.g. `deep_clean`) |
| addr | string | yes | Service address |
| phone | string | no | Customer phone |
| note | string | no | Order note |
| date | string | no | Service date (default `今日`) |
| time | string | no | Service time window |
| lat | number | no | Customer latitude (default 38.5026) |
| lng | number | no | Customer longitude (default 106.1706) |

**Response 201**

```json
{
  "id": "CS1712000000123",
  "type": "深度清洁",
  "status": "pending",
  "price": 399,
  "created": "13:45"
}
```

**Errors**

| HTTP | Condition |
| --- | --- |
| 400 | `type` or `addr` missing |

---

## PUT /api/orders/:id/dispatch

Manually dispatch a pending order to a worker.

**Request Body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| workerId | string | yes | Worker ID |

**Response 200**

```json
{ "order": { "id": "CS1712000000123", "status": "enroute" }, "worker": { "id": "WK03", "name": "王师傅" } }
```

**Errors**

| HTTP | Condition |
| --- | --- |
| 404 | order or worker not found |
| 400 | order already handled, or worker unavailable |

---

## PUT /api/orders/:id/complete

Mark an order as completed; releases the assigned worker.

**Response 200**

```json
{ "id": "CS1712000000123", "status": "done" }
```

**Errors**

| HTTP | Condition |
| --- | --- |
| 404 | order not found |

---

## DELETE /api/orders/:id

Cancel a pending order.

**Request Body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| reason | string | no | Cancel reason (default `用户取消`) |

**Response 200**

```json
{ "id": "CS1712000000123", "status": "cancelled", "cancelReason": "用户取消" }
```

**Errors**

| HTTP | Condition |
| --- | --- |
| 404 | order not found |
| 400 | order is not in `pending` status |

---

## POST /api/orders/:id/review

Rate a completed order. Also updates the worker's average rating.

**Request Body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| rating | number | yes | 1-5 |
| review | string | no | Review text |

**Response 200**

```json
{ "id": "CS1712000000123", "rating": 5, "review": "很好" }
```

**Errors**

| HTTP | Condition |
| --- | --- |
| 404 | order not found |
| 400 | order not `done`, or rating outside 1-5 |

---

## GET /api/stations

List all stations, each with its worker list.

**Response 200**

```json
[
  {
    "id": "ST01",
    "name": "金凤区服务站",
    "lat": 38.492,
    "lng": 106.242,
    "workers": [{ "id": "WK01", "name": "张师傅", "rating": 4.9, "status": "available" }]
  }
]
```

---

## GET /api/stations/nearest?lat=&lng=

Find the nearest station by coordinates; returns all stations enriched with distance, ETA and available-worker count (used by the AI dispatch engine).

**Query Params**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| lat | number | yes | Latitude |
| lng | number | yes | Longitude |

**Response 200**

```json
{
  "station": { "id": "ST01", "name": "金凤区服务站", "distanceKm": 3.2, "etaMinutes": 13, "availableWorkers": 4 },
  "allStations": [
    { "id": "ST01", "name": "金凤区服务站", "distanceKm": 3.2, "etaMinutes": 13, "availableWorkers": 4 }
  ]
}
```

**Errors**

| HTTP | Condition |
| --- | --- |
| 400 | missing `lat` / `lng` |

---

## GET /api/config

Get the pricing table and service type names.

**Response 200**

```json
{
  "priceMap": { "deep_clean": 399, "standard_clean": 199 },
  "typeNames": { "deep_clean": "深度清洁", "standard_clean": "标准清洁" }
}
```
