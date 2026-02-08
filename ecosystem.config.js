module.exports = {
  apps: [
    {
      name: "service-overview",
      script: "node_modules/.bin/next",
      args: "start -p 3002",
      cwd: "/root/Service_Overview",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        PROJECTS_BASE_PATH: "/root",
      },
    },
  ],
};
