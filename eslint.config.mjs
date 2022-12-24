import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  { ignores: ['build/', 'coverage/', 'node_modules/', '.playwright/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    ...react.configs.flat.recommended,
    ...jsxA11y.flatConfigs.recommended,
    plugins: {
      ...react.configs.flat.recommended.plugins,
      ...jsxA11y.flatConfigs.recommended.plugins,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['src/**/*.test.{js,jsx}', 'src/setupTests.js', 'src/testing/**/*.{js,jsx}'],
    languageOptions: { globals: globals.vitest },
  },
  {
    files: ['tools/**/*.js', 'e2e/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['e2e/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'object-shorthand': 'error',
    },
  },
  { files: ['tools/**/*.js', 'e2e/**/*.js'], rules: { 'no-console': 'off' } },
  prettierRecommended,
];
