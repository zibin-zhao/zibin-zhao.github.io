import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '.astro/**',
      'dist/**',
      'public/medit/**',
      'public/singularity/**',
      'node_modules/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['tools/**/*.mjs'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        WebSocket: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    files: ['**/*.astro'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
