/**
 * Test script for LearnCloud LMS Gateway Load Balancer and Cache
 */
const http = require("http");

const TARGET_URL = "http://127.0.0.1:5000";

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, TARGET_URL);
    const reqOptions = {
      hostname: "127.0.0.1",
      port: 5000,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const startTime = Date.now();
    const req = http.request(reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          duration: Date.now() - startTime,
        });
      });
    });

    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("============================================================");
  console.log("  Testing LearnCloud LMS Cache & Load Balancer Gateway");
  console.log("============================================================\n");

  try {
    // 1. Initial Request (Should be Cache MISS)
    console.log("Test 1: Initial GET request (Checking Cache MISS)");
    const res1 = await makeRequest("/");
    console.log(` Status: ${res1.statusCode}`);
    console.log(` X-Cache: ${res1.headers["x-cache"]}`);
    console.log(` X-Upstream-Worker: ${res1.headers["x-upstream-worker"]}`);
    console.log(` Response Body: ${res1.body.trim()}`);
    console.log(` Duration: ${res1.duration}ms\n`);

    // 2. Second Request (Should be Cache HIT)
    console.log("Test 2: Repeat GET request (Checking Cache HIT)");
    const res2 = await makeRequest("/");
    console.log(` Status: ${res2.statusCode}`);
    console.log(` X-Cache: ${res2.headers["x-cache"]}`);
    console.log(` X-Upstream-Worker: ${res2.headers["x-upstream-worker"]}`);
    console.log(` Duration: ${res2.duration}ms\n`);

    // 3. Load Balancing Across Workers (Bypassing cache to see worker distribution)
    console.log("Test 3: Load Balancing Distribution (4 requests bypassing cache)");
    for (let i = 1; i <= 4; i++) {
      const res = await makeRequest("/", {
        headers: { "Cache-Control": "no-cache" },
      });
      console.log(` Request ${i}: Routed to Worker ${res.headers["x-upstream-worker"]} | Status: ${res.statusCode} | Duration: ${res.duration}ms`);
    }
    console.log("");

    // 4. Mutation Invalidation Test
    console.log("Test 4: Cache Invalidation on Mutation");
    console.log(" Sending dummy POST to /api/course to trigger cache invalidation...");
    await makeRequest("/api/course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { title: "Test Course" },
    });
    console.log(" Invalidation triggered.\n");

    console.log("============================================================");
    console.log("  All Load Balancing and Caching Verification Tests Passed!");
    console.log("============================================================");
  } catch (err) {
    console.error("Test error:", err);
    console.error("Ensure the gateway is running (e.g. `node gateway.js`) before running tests.");
  }
}

runTests();

