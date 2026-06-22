import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // jsdom is heavier; default to node for pure logic tests.
    // For component tests (later), opt-in per file with
    // `// @vitest-environment jsdom` at the top.
  },
})
