const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    ts_worker: "./worker/tsWorker.ts"
  },
  output: {
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ["ts-loader"]
      }
    ]
  },
  resolve: {
    extensions: [".ts"]
  }
};
