import type { KnipConfig } from 'knip'

export default {
  entry: [
    // Main application entry points
    'core/app/start/server.ts',

    // CLI entry points
    'cli/cli_root.ts',
    'cli/cli_root_no_connections.ts',

    // Vike configuration and pages
    '+config.ts',
    'pages/**/+*.ts',
    'pages/**/+*.tsx',

    // Test entry points
    'core/tests/setup.e2e.ts',

    // Environment and scripts
    'scripts/**/*.sh',

    // PM2 configs
    'pm2/**/*.cjs',

    // Commitlint config
    'commitlint.config.cjs',
  ],

  project: [
    // Include all TypeScript/JavaScript files
    '**/*.{ts,tsx,js,jsx,mjs,cjs}',
    // Include JSON configs that might import modules
    '**/*.json',
  ],

  ignore: [
    // Build outputs
    'build/**',
    'dist/**',

    // Logs and temporary files
    'logs/**',
    'tmp/**',
    '.tmp/**',

    // Test outputs
    'test-results/**',
    'playwright-report/**',
    'coverage/**',

    // Dependencies
    'node_modules/**',

    // Generated files
    'migrations/**/*.sql',

    // Docker and deployment files
    'docker/**',
    'certs/**',

    // IDE and OS files
    '.vscode/**',
    '.idea/**',
    '**/.DS_Store',
  ],

  ignoreBinaries: [
    // System binaries that might be referenced but not installed
  ],

  ignoreDependencies: [
    // Dependencies that are used but might not be directly imported
    '@types/*', // Type definitions

    // Build and development tools used in scripts
    'env-cmd',

    // Framework dependencies (auto-imported by Vike)
    'rollup-plugin-visualizer',

    // Code quality tools
    'autoprefixer',
    'postcss',
    'tailwindcss', // Used by @tailwindcss/vite plugin
    'tailwindcss-animate',

    // React Email (used in email templates)
    'react-email',

    // Puppeteer (used for PDF generation)
    'puppeteer',

    // False positives - these are actually used but knip can't detect them
    '@harshtalks/slash-tiptap', // Used in composer extensions
    '@tippyjs/react', // Used in tooltip components
  ],

  // Plugin configurations
  vite: {
    config: ['vite.config.ts'],
  },

  vitest: {
    config: ['vitest.config.ts', 'vitest.client.config.ts'],
  },

  playwright: {
    config: ['playwright.config.ts'],
    entry: ['core/tests/e2e/**/*.spec.ts', 'core/tests/e2e/**/*.test.ts'],
  },
} satisfies KnipConfig
