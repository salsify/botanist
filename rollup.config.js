export default {
  input: 'dist/modules/index.js',
  output: {
    file: 'dist/botanist.umd.js',
    name: 'botanist',
    format: 'umd'
  },
  onwarn(warning) {
    if (warning.code !== 'THIS_IS_UNDEFINED') {
      console.warn(warning.message); // eslint-disable-line no-console
    }
  }
}
