var webpack = require('webpack');
var path = require('path');
var config = {
    entry:path.resolve(__dirname, 'example/test.js'),
    output:{
        path:__dirname,
        filename:'bundle.js'
    },
    cache:true,
    module:{
        loaders:[
            {
                test:/\.js$/,
                loaders:'myloader'
            }
        ]
    },
    resolveLoader:{
        modules: ['node_modules','loader']
    }
};
module.exports = config;