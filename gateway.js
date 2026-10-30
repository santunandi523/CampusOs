/**
 * ============================================================================
 * LearnCloud LMS - High-Performance Cache & Load Balancer Gateway
 * ============================================================================
 * 
 * Features:
 *  1. ZERO CODE CHANGES: Sits in front of the existing Express backend without
 *     modifying a single line of server.js or routes.
 *  2. LOAD BALANCING: Distributes requests across multiple backend worker
 *     processes using Round-Robin or Least-Connections with active failover.
 *  3. HIGH-PERFORMANCE IN-MEMORY CACHE:
 *     - Caches GET/HEAD responses with configurable TTL (default: 60s).
 *     - Multi-tenant isolation: Cache keys include hashed Authorization tokens
 *       so private user data (e.g. /createdCourses, /me) is never leaked.
 *     - Automatic Cache Invalidation: Mutations (POST, PUT, DELETE, PATCH)
 *       immediately invalidate corresponding resource cache tags.
 *     - Security bypass: Never caches sensitive endpoints (/api/auth/*).
 *  4. RESILIENCE: Automatic health monitoring & retry on healthy upstream workers.
 *  5. METRICS & DEBUG HEADERS: Emits X-Cache (HIT/MISS/BYPASS), X-Upstream-Worker,
 *     and X-Response-Time headers on every response.
 * ============================================================================
 */

const http = require("http");
const https = require("https");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// ── 1. Configuration & Environment ──────────────────────────────────────────
const BACKEND_DIR = path.resolve(__dirname, "Backend");
const GATEWAY_PORT = parseInt(process.env.GATEWAY_PORT || process.env.PORT || "5000", 10);
const WORKER_COUNT = parseInt(process.env.WORKER_COUNT || "3", 10);
const BASE_WORKER_PORT = parseInt(process.env.BASE_WORKER_PORT || "5001", 10);
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || "60000", 10); // 60 seconds
const CACHE_MAX_ITEMS = parseInt(process.env.CACHE_MAX_ITEMS || "1000", 10);

// Load .env from Backend/.env or current directory if exists
function loadEnvFile(envPath) {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvFile(path.join(BACKEND_DIR, ".env"));
loadEnvFile(path.join(__dirname, ".env"));

// Define upstream worker ports
const UPSTREAM_PORTS = [];
for (let i = 0; i < WORKER_COUNT; i++) {
  UPSTREAM_PORTS.push(BASE_WORKER_PORT + i);
}

// ── 2. In-Memory LRU Cache with Multi-Tenant Scoping ─────────────────────────
class ResponseCache {
  constructor(maxItems = 1000, defaultTtlMs = 60000) {
    this.maxItems = maxItems;
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map(); // key -> { statusCode, headers, body, expiresAt, resourceTag }
  }

  generateKey(req) {
    const method = req.method.toUpperCase();
    const url = req.url;
    // Hash auth token to scope cache per user for authenticated routes
    const authHeader = req.headers["authorization"] || "";
    const authHash = authHeader
      ? crypto.createHash("sha256").update(authHeader).digest("hex").slice(0, 16)
      : "public";
    return `${method}:${url}#${authHash}`;
  }

  getResourceTag(url) {
    // e.g. /api/course/123 -> /api/course
    const parts = url.split("?")[0].split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `/${parts[0]}/${parts[1]}`;
    }
    return url.split("?")[0];
  }

  shouldCache(req) {
    if (req.method !== "GET" && req.method !== "HEAD") return false;
    // Never cache auth endpoints
    if (req.url.startsWith("/api/auth") || req.url.startsWith("/auth")) return false;
    // Bypass if client asks for no-cache
    const cc = req.headers["cache-control"] || "";
    if (cc.includes("no-cache") || cc.includes("no-store")) return false;
    return true;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // LRU refresh
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry;
  }

  set(key, data, resourceTag, ttlMs = this.defaultTtlMs) {
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      ...data,
      resourceTag,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidateTag(resourceTag) {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.resourceTag === resourceTag || key.includes(resourceTag)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      console.log(`[Cache Invalidation] Cleared ${count} cached items for tag: ${resourceTag}`);
    }
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new ResponseCache(CACHE_MAX_ITEMS, CACHE_TTL_MS);

// ── 3. Load Balancer Pool & Health Checker ────────────────────────────────────
class LoadBalancer {
  constructor(ports) {
    this.workers = ports.map((port, idx) => ({
      id: idx + 1,
      port,
      host: "127.0.0.1",
      healthy: true,
      activeConnections: 0,
      totalRequests: 0,
      consecutiveErrors: 0,
    }));
    this.currentIndex = 0;
  }

  getNextWorker() {
    // Filter healthy workers
    const healthyWorkers = this.workers.filter((w) => w.healthy);
    if (healthyWorkers.length === 0) {
      // If all marked unhealthy, try fallback to any worker
      return this.workers[0];
    }

    // Least-Connections with Round-Robin tie breaker
    let selected = healthyWorkers[0];
    for (const worker of healthyWorkers) {
      if (worker.activeConnections < selected.activeConnections) {
        selected = worker;
      }
    }

    // Round-robin iteration as secondary selector
    const rrWorker = healthyWorkers[this.currentIndex % healthyWorkers.length];
    this.currentIndex = (this.currentIndex + 1) % healthyWorkers.length;

    // Use least connections if significant difference, else round robin
    const chosen = selected.activeConnections + 1 < rrWorker.activeConnections ? selected : rrWorker;
    chosen.activeConnections++;
    chosen.totalRequests++;
    return chosen;
  }

  releaseWorker(worker) {
    if (worker && worker.activeConnections > 0) {
      worker.activeConnections--;
    }
  }

  markHealthy(worker) {
    worker.healthy = true;
    worker.consecutiveErrors = 0;
  }

  markUnhealthy(worker) {
    worker.consecutiveErrors++;
    if (worker.consecutiveErrors >= 2) {
      worker.healthy = false;
      console.warn(`[Load Balancer] Worker on port ${worker.port} marked UNHEALTHY.`);
    }
  }

  startHealthChecks() {
    setInterval(() => {
      for (const worker of this.workers) {
        const req = http.request(
          {
            host: worker.host,
            port: worker.port,
            path: "/",
            method: "GET",
            timeout: 2000,
          },
          (res) => {
            if (res.statusCode >= 200 && res.statusCode < 500) {
              if (!worker.healthy) {
                console.log(`[Load Balancer] Worker on port ${worker.port} is BACK ONLINE.`);
              }
              this.markHealthy(worker);
            } else {
              this.markUnhealthy(worker);
            }
            res.resume();
          }
        );
        req.on("error", () => {
          this.markUnhealthy(worker);
        });
        req.on("timeout", () => {
          req.destroy();
          this.markUnhealthy(worker);
        });
        req.end();
      }
    }, 5000);
  }
}

const loadBalancer = new LoadBalancer(UPSTREAM_PORTS);

// ── 4. Worker Process Supervisor ──────────────────────────────────────────────
const spawnedProcesses = [];

function spawnWorker(port) {
  console.log(`[Supervisor] Spawning backend worker on PORT=${port}...`);
  const workerEnv = {
    ...process.env,
    PORT: String(port),
    MONGODB_URL: process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/learncloud",
    JWT_SECRET: process.env.JWT_SECRET || "learncloud_dev_secret_key_12345",
  };

  const child = spawn(process.execPath, [path.join(BACKEND_DIR, "server.js")], {
    env: workerEnv,
    cwd: BACKEND_DIR,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    const text = data.toString().trim();
    if (text) {
      console.log(`[Worker ${port}] ${text}`);
    }
  });

  child.stderr.on("data", (data) => {
    const text = data.toString().trim();
    if (text) {
      console.error(`[Worker ${port}:ERR] ${text}`);
    }
  });

  child.on("exit", (code, signal) => {
    console.warn(`[Supervisor] Worker ${port} exited (code: ${code}, signal: ${signal}). Restarting in 2s...`);
    setTimeout(() => spawnWorker(port), 2000);
  });

  spawnedProcesses.push(child);
  return child;
}

function startAllWorkers() {
  console.log("============================================================");
  console.log(` Starting ${UPSTREAM_PORTS.length} Backend Worker Instances for Load Balancing`);
  console.log("============================================================");
  for (const port of UPSTREAM_PORTS) {
    spawnWorker(port);
  }
}

// ── 5. Reverse Proxy Request Handler ──────────────────────────────────────────

// CORS headers injected by the gateway on every response.
// The browser enforces CORS for cross-origin requests (frontend :5173 → gateway :5000).
// Upstream workers also set cors() but the gateway guarantees them at the proxy layer.
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization, Cache-Control",
  "access-control-max-age": "86400",
};

function handleRequest(req, res) {
  const startTime = Date.now();

  // Handle CORS preflight (OPTIONS) immediately — no upstream roundtrip needed
  if (req.method === "OPTIONS") {
    res.writeHead(204, { ...CORS_HEADERS, "content-length": "0" });
    res.end();
    return;
  }

  // Buffer the full request body upfront before doing anything else.
  // This is essential so:
  //   a) The body stream isn't consumed before the proxy request is made
  //   b) On failover retries, the same body buffer can be re-sent
  const bodyChunks = [];
  req.on("data", (chunk) => bodyChunks.push(chunk));
  req.on("end", () => {
    const bodyBuffer = Buffer.concat(bodyChunks);

    // Handle mutations: Invalidate cache tag
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method.toUpperCase())) {
      const resourceTag = cache.getResourceTag(req.url);
      cache.invalidateTag(resourceTag);
    }

    // 1. Cache Check (only for GET/HEAD)
    if (cache.shouldCache(req)) {
      const cacheKey = cache.generateKey(req);
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        res.writeHead(cachedResponse.statusCode, {
          ...cachedResponse.headers,
          ...CORS_HEADERS,
          "X-Cache": "HIT",
          "X-Load-Balancer": "LearnCloud-Gateway",
          "X-Upstream-Worker": "CACHE",
          "X-Response-Time": `${responseTime}ms`,
        });
        res.end(cachedResponse.body);
        return;
      }
    }

    // 2. Load Balance to Upstream Worker (passing buffered body for retries)
    forwardToWorker(req, res, bodyBuffer, startTime, 0);
  });

  req.on("error", (err) => {
    console.error("[Gateway] Request error:", err.message);
    if (!res.headersSent) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Bad request" }));
    }
  });
}

function forwardToWorker(req, res, bodyBuffer, startTime, retryCount = 0) {
  if (retryCount >= UPSTREAM_PORTS.length) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "All upstream backend workers are currently unavailable." }));
    return;
  }

  const worker = loadBalancer.getNextWorker();
  const shouldCacheThis = cache.shouldCache(req);
  const cacheKey = shouldCacheThis ? cache.generateKey(req) : null;
  const resourceTag = shouldCacheThis ? cache.getResourceTag(req.url) : null;

  // Build proxy headers — correct Content-Length based on buffered body
  const proxyHeaders = { ...req.headers };
  proxyHeaders["x-forwarded-for"] = proxyHeaders["x-forwarded-for"]
    ? `${proxyHeaders["x-forwarded-for"]}, ${req.socket.remoteAddress}`
    : req.socket.remoteAddress;
  proxyHeaders["x-forwarded-proto"] = "http";
  proxyHeaders["x-forwarded-port"] = String(GATEWAY_PORT);
  proxyHeaders["host"] = `localhost:${worker.port}`;
  // Disable keep-alive so upstream closes connection after response — prevents hang
  proxyHeaders["connection"] = "close";
  // Correct content-length to match the actual buffered body size
  if (bodyBuffer.length > 0) {
    proxyHeaders["content-length"] = String(bodyBuffer.length);
  } else {
    delete proxyHeaders["content-length"];
    delete proxyHeaders["transfer-encoding"];
  }

  // Normalize path: if request is sent without /api prefix, add it so Express routes match
  let upstreamPath = req.url;
  if (!upstreamPath.startsWith("/api") && (
    upstreamPath.startsWith("/auth") ||
    upstreamPath.startsWith("/course") ||
    upstreamPath.startsWith("/assignments") ||
    upstreamPath.startsWith("/students")
  )) {
    upstreamPath = "/api" + upstreamPath;
  }

  const proxyReq = http.request(
    {
      host: worker.host,
      port: worker.port,
      path: upstreamPath,
      method: req.method,
      headers: proxyHeaders,
      timeout: 15000,
    },
    (proxyRes) => {
      loadBalancer.releaseWorker(worker);
      loadBalancer.markHealthy(worker);

      const responseTime = Date.now() - startTime;
      const responseHeaders = { ...proxyRes.headers };
      // Merge CORS headers — gateway always guarantees them for browser clients
      Object.assign(responseHeaders, CORS_HEADERS);
      responseHeaders["X-Cache"] = shouldCacheThis ? "MISS" : "BYPASS";
      responseHeaders["X-Load-Balancer"] = "LearnCloud-Gateway";
      responseHeaders["X-Upstream-Worker"] = String(worker.port);
      responseHeaders["X-Response-Time"] = `${responseTime}ms`;
      // Force connection close so client knows the response is complete
      responseHeaders["connection"] = "close";

      // Always buffer the full response body first.
      // This ensures keep-alive upstream connections don't stall the client,
      // and allows us to set a correct Content-Length on the gateway response.
      const chunks = [];
      proxyRes.on("data", (chunk) => chunks.push(chunk));
      proxyRes.on("end", () => {
        const body = Buffer.concat(chunks);
        responseHeaders["content-length"] = String(body.length);

        // Store in cache only for cacheable 200 GET responses
        if (shouldCacheThis && proxyRes.statusCode === 200) {
          cache.set(cacheKey, {
            statusCode: proxyRes.statusCode,
            headers: responseHeaders,
            body,
          }, resourceTag);
        }

        if (!res.headersSent) {
          res.writeHead(proxyRes.statusCode, responseHeaders);
          res.end(body);
        }
      });
      proxyRes.on("error", (err) => {
        console.error(`[Proxy] Response error from worker ${worker.port}:`, err.message);
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Bad gateway" }));
        }
      });
    }
  );

  proxyReq.on("timeout", () => {
    proxyReq.destroy();
    loadBalancer.releaseWorker(worker);
    loadBalancer.markUnhealthy(worker);
    console.warn(`[Proxy] Timeout on worker ${worker.port}, failing over...`);
    forwardToWorker(req, res, bodyBuffer, startTime, retryCount + 1);
  });

  proxyReq.on("error", (err) => {
    loadBalancer.releaseWorker(worker);
    loadBalancer.markUnhealthy(worker);
    console.warn(`[Proxy] Connection failed on worker ${worker.port} (${err.code}), failing over...`);
    forwardToWorker(req, res, bodyBuffer, startTime, retryCount + 1);
  });

  // Write the pre-buffered body and end the proxy request
  if (bodyBuffer.length > 0) {
    proxyReq.write(bodyBuffer);
  }
  proxyReq.end();
}

// ── 6. Gateway Server Initialization ──────────────────────────────────────────
const gatewayServer = http.createServer(handleRequest);

function cleanup() {
  console.log("\n[Gateway] Shutting down workers and gateway...");
  for (const child of spawnedProcesses) {
    try {
      child.kill("SIGTERM");
    } catch (_) {}
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Start workers first, then start gateway
startAllWorkers();

// Allow workers 1.5 seconds to bind ports, then open gateway
setTimeout(() => {
  gatewayServer.listen(GATEWAY_PORT, "0.0.0.0", () => {
    console.log("============================================================");
    console.log(` LearnCloud Gateway Active on http://127.0.0.1:${GATEWAY_PORT}`);
    console.log(` Load Balancing: Round-Robin + Least-Connections`);
    console.log(` Upstream Backend Workers: ${UPSTREAM_PORTS.map((p) => `http://localhost:${p}`).join(", ")}`);
    console.log(` Cache Layer: In-Memory Multi-Tenant LRU Cache (TTL: ${CACHE_TTL_MS / 1000}s)`);
    console.log(` Cache Headers: X-Cache (HIT/MISS/BYPASS), X-Upstream-Worker`);
    console.log("============================================================\n");
    loadBalancer.startHealthChecks();
  });
}, 1500);

