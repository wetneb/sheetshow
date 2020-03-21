const path = require('path');

module.exports = {
  entry: './src/index.js',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist'
  },
  node: {
    fs: 'empty'
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'sheetshow',
  },
};
