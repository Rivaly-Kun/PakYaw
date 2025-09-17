const path = require('path')

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'system'),
        filename: 'bundle.js'
    },
    watch: true
}