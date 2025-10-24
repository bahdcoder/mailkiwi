/// <reference types="vite/client" />
/// <reference path="./namecheap.d.ts" />

interface ImportMetaEnv {
  /**
   * The value of the variable is set in scripts/watch.js and depend on packages/main/vite.config.js
   */
  readonly PUBLIC_ENV__NODE_ENV: 'staging' | 'production' | 'test' | 'development'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
