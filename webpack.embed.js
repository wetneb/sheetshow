const path = require('path');

module.exports = {
  entry: './src/embed.js',
  devtool: 'inline-source-map',
  mode: 'development',
  devServer: {
    contentBase: './dist/embed'
  },
  node: {
    fs: 'empty'
  },
  output: {
    filename: 'sheetshow.js',
    path: path.resolve(__dirname, 'dist/embed'),
    library: 'sheetshow',
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: ['*', '.js', '.vue', '.json']
  },
  module: {
    rules: [
      {
	test: /\.vue$/,
	loader: 'vue-loader'
      }
    ]
  }
};
