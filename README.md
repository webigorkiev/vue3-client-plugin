<h1 align="center"> vue3-client-plugin </h1>
<p align="center">
  <b>When rendering a bundle that leverages webpack's on-demand code splitting features, we can ensure the optimal chunks are preloaded / prefetched, and also intelligently inject tags for needed async chunks to avoid waterfall requests on the client, thus improving TTI (time-to-interactive)</b>
</p>

## Installation

```bash
npm i --save-dev vue3-client-plugin
```

## Features

* webpack 5
* vue3
* source-map

## Usage

```javascript
const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const baseConfig = require('./webpack.base.config.js')
const Vue3SSRClientPlugin = require('vue3-client-plugin')

module.exports = merge(baseConfig, {
    entry: '/path/to/entry-client.js',
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: "manifest",
            minChunks: Infinity
        }),
        new Vue3SSRClientPlugin()
    ]
})

```