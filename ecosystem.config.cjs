module.exports = {
  apps: [
    {
      name: "emoticones",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        ADMIN_PIN: process.env.ADMIN_PIN || "emoti2026",
      },
    },
  ],
};
