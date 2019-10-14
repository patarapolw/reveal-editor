const path = require("path");

const config = {
  mode: "production",
  entry: './src/index.ts',
  output: {
    path: path.resolve("../web/public"),
    filename: 'reveal.min.js'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.s?css$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(woff|woff2|ttf|otf|eot)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'reveal/'
        }
      },
    ]
  },
  resolve: {
    extensions: [
      '.tsx',
      '.ts',
      '.js'
    ]
  }
};

module.exports = config;