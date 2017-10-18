## 如何开发一个plugin  

插件将webpack引擎所有的能力暴露给第三方开发者。通过阶梯式的build回调，开发者可以在webpack编译过程中加入自己的行为。开发插件比loaders更加先进一点，因为你需要理解webpack一些底层构成来添加钩子回调。准备好读一些源码吧。     

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

## 访问编译    

通过使用编译器对象，你可能会绑定提供指向每个新的compilation应用的回调。这些compilations提供了编译过程中很多步骤的回调函数。   

```js
function HelloCompilationPlugin(options) {}

HelloCompilationPlugin.prototype.apply = function(compiler) {

  // Setup callback for accessing a compilation:
  compiler.plugin("compilation", function(compilation) {

    // Now setup callbacks for accessing compilation steps:
    compilation.plugin("optimize", function() {
      console.log("Assets are being optimized.");
    });
  });
};

module.exports = HelloCompilationPlugin;
```      
如果想了解更多关于在编译器、编译中哪些回调是可用的和其他一些更重要的对象，轻戳[plugin文档](https://doc.webpack-china.org/api/plugins/) 

## 异步插件    

一些编译插件步骤是异步的并且提供了一个当你的插件结束编译时必须调用的回调方法

```js
function HelloAsyncPlugin(options) {}

HelloAsyncPlugin.prototype.apply = function(compiler) {
  compiler.plugin("emit", function(compilation, callback) {

    // Do something async...
    setTimeout(function() {
      console.log("Done with async work...");
      callback();
    }, 1000);

  });
};

module.exports = HelloAsyncPlugin;
```  

## 示例  

一旦我们打开了webpack编译器和每个单独编译的大门，我们可以使用引擎做的事情是无限可能的。我们可以重新格式化存在的文件、创建派生文件、完全伪造一个新文件  

让我们写个简单的示例插件，目的是生成一个新的名字为filelist.md的文件。内容如下：列出构建过程中所有的生成文件。这个插件大概如下：
 
```js
function FileListPlugin(options) {}

FileListPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', function(compilation, callback) {
    // Create a header string for the generated file:
    var filelist = 'In this build:\n\n';

    // Loop through all compiled assets,
    // adding a new line item for each filename.
    for (var filename in compilation.assets) {
      filelist += ('- '+ filename +'\n');
    }

    // Insert this list into the webpack build as a new file asset:
    compilation.assets['filelist.md'] = {
      source: function() {
        return filelist;
      },
      size: function() {
        return filelist.length;
      }
    };

    callback();
  });
};

module.exports = FileListPlugin;
```     

## 不同类型的插件   

插件可以依据其注册的事件来分成不同的类型，每个事件钩子决定了在触发时如何调用该插件。  

#### 同步类型 

这种类型的实例使用如下方式来调用插件  
```js
applyPlugins(name: string, args: any...)

applyPluginsBailResult(name: string, args: any...)  
```
这意味着每一个插件的回调将伴随特定参数args依次被调用。对插件而言这是最简单的格式。很多有用的事件例如"compile", "this-compilation"，是期望插件同步执行的。  

#### 流式类型 

waterfall Plugins 通过下面的方式调用  
```js
applyPluginsWaterfall(name: string, init: any, args: any...)
```  

#### 异步类型   

当所有的插件被使用下面的方法异步调用的时候，即为异步插件
```js
applyPluginsAsync(name: string, args: any..., callback: (err?: Error) -> void)
```    
插件控制方法被调用，参数是所有的args和带有这种标志(err?: Error) -> void的回调。handler方法按照注册回调在所有handlers被调用之后的顺序来调用。对于"emit", "run"事件来说这是很常用的模式。

#### 异步流    

这种插件将按照流失方式来被异步使用  

```js
applyPluginsAsyncWaterfall(name: string, init: any, callback: (err: Error, result: any) -> void)
```   
这种插件的handler被调用时，参数是当前value和带有这种标志(err?: Error) -> void的回调。当被调用时，nextValue是下一个handler的当前值。第一个handler的当前值是init。所有的handler被调用之后，最后一个值将会被赋给回调。如果有的handler传递了一个err的值，回调将会接受err，并且不会有其他handler被第阿勇。这种插件模式使用与于"before-resolve" and "after-resolve"之类的事件。   

#### 异步系列  

这种和异步插件很相似，不同在于如果有点插件注册失败，将不会调用任何插件   
```js
applyPluginsAsyncSeries(name: string, args: any..., callback: (err: Error, result: any) -> void)
```    
