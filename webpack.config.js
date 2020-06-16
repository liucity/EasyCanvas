var path = require('path')

module.exports = {
  devServer: {
    inline: true,
    host: '127.0.0.1'
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    main: './src/index.js',
  },
  output: {
    publicPath: '/dist/',
    filename: 'canvas.[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          // options: {
          //   presets: ['@babel/preset-env']
          // }
        }
      },
      // {
      //   test: /\.(png|jpg|woff|svg|eot|ttf)\??.*$/,
      //   loader: 'file-loader',
      //   options: {
      //     name: '[path][name].[ext]'
      //   }
      // }
    ]
  },
  // resolve: {
  // },
  // devServer: {
  //   historyApiFallback: true,
  //   noInfo: true
  // },
  // performance: {
  //   hints: false
  // },
  devtool: 'source-map',
  plugins: [
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: "vendor",
    //   // ( 公共chunk(commnons chunk) 的名称)

    //   filename: "commons.js"
    // })
  ],
  optimization: {
    minimize: process.env.NODE_ENV === 'production'
  }
}



// if (process.env.NODE_ENV === 'production') {
//   module.exports.devtool = '#source-map'
//   module.exports.plugins = (module.exports.plugins || []).concat([
//     new webpack.DefinePlugin({
//       'process.env': {
//         NODE_ENV: '"production"'
//       }
//     }),
//     new webpack.LoaderOptionsPlugin({
//       minimize: true
//     })
//   ])
// }
