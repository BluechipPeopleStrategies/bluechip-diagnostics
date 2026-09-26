import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Vercel serverless functions and the test runner execute under Node, not a browser -- they
  // reference process/Buffer/global directly, same as every existing api/*.js and tests/*.js
  // file already does. This was previously uncovered by any globals set (no-undef errors were
  // already present on every file in both directories before this override was added).
  {
    files: ['api/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
])
