var gulp = require('gulp');
var path = require('path');
var webpack = require('webpack');
var config = require('./webpack.config.js')
gulp.task('webpack',function(){
    webpack(config,function(err,status){
        if(err){
            console.log(err)
            return 
        }
    })
})
gulp.task('default',['webpack'])