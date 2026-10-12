module.exports = {
  apps: [
    {
      name: 'devhub',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4000',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: 'development',
        args: 'dev -p 4000',
      },
    },
  ],
};
