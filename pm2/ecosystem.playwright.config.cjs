module.exports = {
  apps: [
    {
      name: 'kibamail-app-playwright',
      script: './pm2/start.playwright.sh',
      interpreter: '/bin/bash',
      autorestart: true,
      watch: false,
      out_file: './logs/dev-server-playwright-out.log',
      error_file: './logs/dev-server-playwright-error.log',
      merge_logs: true,
    },
    {
      name: 'kibamail-worker-playwright',
      script: './pm2/start.playwright.worker.sh',
      interpreter: '/bin/bash',
      autorestart: true,
      watch: false,
      out_file: './logs/dev-worker-playwright-out.log',
      error_file: './logs/dev-worker-playwright-error.log',
      merge_logs: true,
    },
  ],
}
