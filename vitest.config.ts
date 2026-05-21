import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/**/*.d.ts',
        'lib/**/tsconfig.json',
        'lib/react/**',
        'lib/solid/**',
        'lib/vue/**',
        'lib/vike/global.d.ts',
      ],
    },
  },
})
