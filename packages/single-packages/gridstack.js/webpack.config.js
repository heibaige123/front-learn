const path = require('path');

module.exports = {
  entry: {
    'gridstack.all': './src/index.ts',
    'gridstack': './src/gridstack.ts',
    /*
    'types': './src/types.ts',
    'utils': './src/utils.ts',
    'gridstack-engine': './src/gridstack-engine.ts',
    'gridstack-dd': './src/gridstack-dd.ts',
    'jq/gridstack-dd-jqueryui': './src/jq/gridstack-dd-jqueryui.ts',
    */
  },
  mode: 'production', // production vs development
  devtool: 'source-map',
  // devtool: 'use eval-source-map', // for best (large .js) debugging. see https://survivejs.com/webpack/building/source-maps/
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'GridStack',
    libraryExport: 'GridStack',
    libraryTarget: 'umd', // "var" | "assign" | "this" | "window" | "self" | "global" | "commonjs" | "commonjs2" | "commonjs-module" | "amd" | "amd-require" | "umd" | "umd2" | "jsonp" | "system"
  }
};
