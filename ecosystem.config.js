/* eslint-disable */
const fs = require('fs');
const path = require('path');

const hasBuild = fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'));

module.exports = {
  apps: [
    {
      name: 'devhub',
      script: 'node_modules/next/dist/bin/next',
      args: hasBuild ? 'start -p 4001' : 'dev -p 4001',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: false,
      max_restarts: 3,
      min_uptime: '10s',
      restart_delay: 4000,
      windowsHide: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: hasBuild ? 'production' : 'development',
        PORT: 4001,
      },
      env_development: {
        NODE_ENV: 'development',
        args: 'dev -p 4001',
        PORT: 4001,
      },
    },
  ],
};
