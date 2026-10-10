# Test Cases

## Approach

- **Black-box**: design cases from input/output only — equivalence classes and boundary values (missing fields, invalid ratings, illegal status transitions).
- **White-box**: design cases from code structure — branch coverage of dispatch logic, status guards, and the AI fallback path.

Legend: ✅ = executed & passed · ⬜ = planned · ❌ = failed

## Order Management

| TC | Module | Type | Precondition | Steps | Expected | Result |
| --- | --- | --- | --- | --- | --- | --- |
| TC-001 | Create order | black | server running | POST `/api/orders` with `type` + `addr` | 201, order with `status=pending` | ✅ |
| TC-002 | Create order | black | — | POST `/api/orders` without `addr` | 400 with error message | ✅ |
| TC-003 | Create order | black | — | POST `/api/orders` without `type` | 400 with error message | ✅ |
| TC-004 | List orders | black | orders exist | GET `/api/orders` | 200, newest first | ✅ |
| TC-005 | Cancel pending | black | order is `pending` | DELETE `/api/orders/:id` | 200, `status=cancelled` | ✅ |
| TC-006 | Cancel non-pending | black | order is `enroute` | DELETE `/api/orders/:id` | 400 | ✅ |
| TC-007 | Cancel missing | black | — | DELETE `/api/orders/unknown` | 404 | ✅ |

## Dispatch

| TC | Module | Type | Precondition | Steps | Expected | Result |
| --- | --- | --- | --- | --- | --- | --- |
| TC-008 | Manual dispatch | black | order `pending`, worker available | PUT `/api/orders/:id/dispatch` with `workerId` | 200, `status=enroute`, worker `busy` | ✅ |
| TC-009 | Dispatch missing order | black | — | PUT `/api/orders/unknown/dispatch` | 404 | ✅ |
| TC-010 | Dispatch handled order | black | order `enroute` | PUT dispatch again | 400 | ✅ |
| TC-011 | Dispatch busy worker | black | worker `busy` | PUT dispatch to busy worker | 400 | ✅ |
| TC-012 | AI dispatch failure | white | DeepSeek key invalid / network down | POST `/api/orders` | 201; order stays `pending`; error logged, no crash | ⬜ |
| TC-013 | AI dispatch success | white | valid key, available worker | POST `/api/orders` | order becomes `enroute` with `aiReason` | ⬜ |

## Review & Completion

| TC | Module | Type | Precondition | Steps | Expected | Result |
| --- | --- | --- | --- | --- | --- | --- |
| TC-014 | Complete order | black | order `enroute` | PUT `/api/orders/:id/complete` | 200, `status=done`, worker released | ✅ |
| TC-015 | Review done order | black | order `done` | POST `/api/orders/:id/review` rating=5 | 200, rating saved, worker avg updated | ✅ |
| TC-016 | Review non-done | black | order `pending` | POST review | 400 | ✅ |
| TC-017 | Review boundary | black | order `done` | POST review rating=0 / 6 | 400 (out of 1-5) | ✅ |

## Stations & Config

| TC | Module | Type | Precondition | Steps | Expected | Result |
| --- | --- | --- | --- | --- | --- | --- |
| TC-018 | List stations | black | — | GET `/api/stations` | 200, includes workers | ✅ |
| TC-019 | Nearest station | black | — | GET `/api/stations/nearest?lat=38.5&lng=106.2` | 200, nearest first | ✅ |
| TC-020 | Nearest missing params | black | — | GET `/api/stations/nearest` | 400 | ✅ |
| TC-021 | Config endpoint | black | — | GET `/api/config` | 200, priceMap + typeNames | ✅ |

## Summary

| Metric | Value |
| --- | --- |
| Total cases | 21 |
| Passed | 17 |
| Failed | 0 |
| Planned (need API key / live AI) | 2 (TC-012, TC-013) |
| Defect list | — |
