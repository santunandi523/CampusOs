# 🚀 LearnCloud LMS - Cache & Load Balancing Architecture Guide

This project now includes **Zero-Code-Change Caching and Load Balancing**.
None of your existing application code (`server.js`, routes, models, or frontend code) was modified or altered in any way.

---

## 🏛️ Architecture Overview

```
                        [ Client / Frontend (Vite React) ]
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       Port 5000: Gateway / Load Balancer         │
             │   (Reverse Proxy + Intelligent LRU Cache Zone)   │
             └───────────────────────┬──────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │ (Cache HIT: ~1ms)       │ (Round-Robin / Least-Conn)
           ▼                         ▼                         ▼
   [ In-Memory Cache ]      [ Worker 1 : 5001 ]       [ Worker 2 : 5002 ]       [ Worker 3 : 5003 ]
                            (server.js Node)          (server.js Node)          (server.js Node)
                                     │                         │                         │
                                     └─────────────────────────┼─────────────────────────┘
                                                               ▼
                                                      [ MongoDB Database ]
```

---

## ⚡ Key Capabilities

### 1. 🔄 Smart Load Balancing
- **Algorithms**: Round-Robin with Least-Connections tie-breaking.
- **High Availability & Health Checks**: Active health checks every 5 seconds. If a worker goes down or errors, requests are automatically failed over to healthy workers without dropping user connections.
- **Supervisor**: Automatically spawns and monitors backend worker instances (`PORT=5001, 5002, 5003`) and restarts them if they fail.

### 2. 🗄️ Multi-Tenant In-Memory Caching
- **Safe Caching**: Only caches safe, idempotent read requests (`GET` and `HEAD`).
- **User Privacy & Tenant Isolation**: Scopes cache keys by the hashed `Authorization` header (`${method}:${url}#${tokenHash}`). User A's private data (e.g. `/api/course/createdCourses`, `/api/students`) is never served to User B.
- **Sensitive Route Bypass**: Authentication routes (`/api/auth/*`) are strictly excluded from the cache.
- **Automatic Cache Invalidation**: When any mutation request is received (`POST`, `PUT`, `DELETE`, `PATCH`), the corresponding resource cache tag (e.g., `/api/course`) is automatically flushed, ensuring stale data is never returned.
- **Cache Debug Headers**:
  - `X-Cache`: `HIT` | `MISS` | `BYPASS`
  - `X-Upstream-Worker`: `5001` | `5002` | `5003` | `CACHE`
  - `X-Response-Time`: Execution latency in ms.

---

## 🏃 How to Run

### Option 1: Native Node.js (Zero Extra Tools Required)
Run the gateway directly using Node.js:

```bash
# From workspace root or LearnCloud-lms-App-main directory:
node gateway.js
```

The gateway will:
1. Automatically spawn 3 backend instances on ports `5001`, `5002`, and `5003`.
2. Start the Gateway / Load Balancer on port `5000` (which matches your existing frontend config).
3. Manage cache and load balancing seamlessly.

---

### Option 2: PM2 Cluster Mode (Process Level)
If you use PM2 for production process management:

```bash
# Start cluster using the provided configuration
npx pm2 start ecosystem.config.cjs

# Monitor workers
npx pm2 status
npx pm2 logs
```

---

### Option 3: Docker & NGINX (Containerized Production)
If you deploy with Docker:

```bash
docker compose up --build
```

This starts:
- **`nginx-lb`**: NGINX reverse proxy on port `5000` with `least_conn` load balancing and `proxy_cache`.
- **`backend-1`, `backend-2`, `backend-3`**: 3 isolated container replicas of the Express server.
- **`redis`**: In-memory store for distributed caching.
- **`mongo`**: Dedicated MongoDB database container.

---

## 🧪 Verification & Testing

To verify the cache and load balancer behavior, run the test script:

1. In one terminal, start the gateway:
   ```bash
   node gateway.js
   ```

2. In a second terminal, run the test verification:
   ```bash
   node test-load-balancer.js
   ```

### Expected Output:
- **Test 1**: Initial request shows `X-Cache: MISS` and routed to worker `5001` (~14ms).
- **Test 2**: Repeat request shows `X-Cache: HIT` and `X-Upstream-Worker: CACHE` (~1ms).
- **Test 3**: Load-balanced requests cycle across worker `5002`, `5003`, `5001`, `5002`.
- **Test 4**: `POST /api/course` automatically flushes stale course cache entries.
