## 如何开发一个plugin  


#### 什么是plugin  
  
loader是一个对面暴露一个方法的node包.当遇到某些资源需要被转换时调用该方法。  
在简单的情况下，只有一个loader来处理某个文件时，该loader被调用时只有一个参数，这个参数是该文件的内容转化之后的字符串。  
```js  
     // webpack.config.js
    module.exports = {
        ...
    lessLoader: {
        lessPlugins: [
        new LessPluginCleanCSS({advanced: true})
        ]
    }
};
```  

插件将webpack引擎所有的能力暴露给第三方开发者。通过阶梯式的build回调，开发者可以在webpack编译过程中加入自己的行为。开发插件比loaders更加先进一点，因为你需要理解webpack一些底层构成来添加钩子回调。准备好读一些源码吧。   
A plugin for webpack consists of

A named JavaScript function.
Defines apply method in it's prototype.
Specifies webpack's event hook to attach itself.
Manipulates webpack internal instance specific data.
Invokes webpack provided callback after functionality is complete.
## 开发一个插件   

一个webpack的插件由以下几方面组成：  
* 一个非匿名的js函数   
* 在它的原型对象上定义apply方法  
* 指明挂载自身的webpack钩子事件  
* 操作webpack内部情况的特定数据  
* 方法完成时唤起webpack提供的回调
```js
// A named JavaScript function.
function MyExampleWebpackPlugin() {

};

// Defines `apply` method in it's prototype.
MyExampleWebpackPlugin.prototype.apply = function(compiler) {
  // Specifies webpack's event hook to attach itself.
  compiler.plugin('webpacksEventHook', function(compilation /* Manipulates webpack internal instance specific data. */, callback) {
    console.log("This is an example plugin!!!");

    // Invokes webpack provided callback after functionality is complete.
    callback();
  });
};    
```  
## 编译器和编译     

开发插件过程中最重要的两个对象就是compiler 和compilation。理解他们的职责是扩展webpack功能最重要的第一步   

编译器对象就是webpack完整的配置环境。该对象一经webpack开始执行就创建，并且通过所有可操作的设置项来设置，例如options，loaders，和plugins。当在webpack环境中应用一个插件时，该插件将会接受到一个指向该编译器的引用。使用该编译器来访问主要的webpack环境。

compilation对象是一个单独的关于版本资源的创建。当执行webpack 开发中间件时，当一个文件的更改被检测到就会创建一个新的compilation对象，因此产生了一些可被编译的资源。一个compilation展现了一些信息关于当前模块资源状态、编译资源、改变的文件、监视的依赖等信息。同样提供了很多关键的回调，当插件扩展自定义行为时   

这两个组件是webpack 插件必需的组成部分(特别是compilation)，所以开发者如果熟悉下面这些源文件将会获益不小。   
* [Compiler Source](https://github.com/webpack/webpack/blob/master/lib/Compiler.js)  
* [Compilation Source](https://github.com/webpack/webpack/blob/master/lib/Compilation.js)   

## 插件的基本结构   

插件是在原型中带有一个apply方法的实例化对象，当安装插件的时候，这个apply方法就会被webpack调用一次。apply方法提供一个指向当前活动的webpack compiler的引用，该引用允许访问compiler的回调。一个简单的插件结构如下：  
 
```js
function HelloWorldPlugin(options) {
  // Setup the plugin instance with options...
}

HelloWorldPlugin.prototype.apply = function(compiler) {
  compiler.plugin('done', function() {
    console.log('Hello World!');
  });
};

module.exports = HelloWorldPlugin;   
```    
然后安装一个插件，仅仅需要在你的 webpack config 中plugins对应的数组中，增加一个插件的实例即可   

```js
var HelloWorldPlugin = require('hello-world');

var webpackConfig = {
  // ... config settings here ...
  plugins: [
    new HelloWorldPlugin({options: true})
  ]
};
```     





