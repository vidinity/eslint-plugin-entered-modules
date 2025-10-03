import type { ESLint } from 'eslint';
import noInvalidEntryImports from './rules/no-invalid-entry-imports.js';

const plugin: ESLint.Plugin = {
  meta: {
    name: 'eslint-plugin-entered-modules',
    version: '0.1.0',
  },
  rules: {
    'no-invalid-entry-imports': noInvalidEntryImports,
  },
  configs: {
    recommended: {
      plugins: ['entered-modules'],
      rules: {
        'entered-modules/no-invalid-entry-imports': 'error',
      },
    },
  },
};

export default plugin;
