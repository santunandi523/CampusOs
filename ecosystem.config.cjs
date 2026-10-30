module.exports = {
  apps: [
    {
      name: "learncloud-gateway",
      script: "./gateway.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        GATEWAY_PORT: 5000,
        WORKER_COUNT: 3,
        BASE_WORKER_PORT: 5001,
        CACHE_TTL_MS: 60000
      }
    }
  ]
};

