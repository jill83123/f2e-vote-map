// @ts-check
import prettierPlugin from 'eslint-plugin-prettier';
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  // Your custom configs here
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.vue'],
    rules: {
      'no-console': 'warn',
    },
  },
);
