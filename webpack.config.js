const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: './src/abxy',
  output: {
    path: __dirname + "/dist",
    filename: 'abxy.min.js'
  },

  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel',
      }
    ]
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
    })
  ],
};
