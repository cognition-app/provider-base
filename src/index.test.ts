if (module.hot) {
  const context = require.context(
    "mocha-loader!./",
    true,
    /\.test\.jsx?$/,
  )
  context.keys().forEach(context)
}
