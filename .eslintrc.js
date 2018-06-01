module.exports = {
  parser: 'typescript-eslint-parser',
  parserOptions: {
    sourceType: 'module'
  },
  extends: ['eslint:recommended'],
  rules: {
    // Covered by tsc
    'no-undef': 'off',
    'no-unused-vars': 'off'
  }
};
