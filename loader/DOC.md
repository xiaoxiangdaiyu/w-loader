## 如何开发一个loader  

#### 什么是loader  
  
loader是一个对面暴露一个方法的node包.当遇到某些资源需要被转换时调用该方法。  
在简单的情况下，只有一个loader来处理某个文件时，该loader被调用时只有一个参数，这个参数是该文件的内容转化之后的字符串。  

loader在function执行时可以通过this context来访问laoder API 以便更高效的开发。  

一个仅仅需要一个值的同步loader可以简单的return 自己。其他情况下，loader可以通过this.callback(err, values...)返回一系列的值。error同样传递给this.callback或者在loader中抛出。  

loader期望返回1-2个值，第一个是处理之后作为string或者buffer返回的js代码。第二个是SourceMap或者js 对象   

看一下复杂的情况:当多个loader被链式调用时，只有最后一个loader获得资源文件。  
同时只有第一个loader被期望返回1-2个值(即上面提到的JavaScript和SourceMap)。  
其他loader接收值由上一个loader传递。  

换句话说，链式loader执行顺序从右至左或者自下而上。  
举个栗子：下面这段代码的执行顺序就是自下而上  foo-loader==>bar-loader  
```js
module: {
  loaders: [
    {
      test: /\.js/,
      loaders: [
        'bar-loader',
        'foo-loader'
      ]
    }
  ]
}
```  

注意：当前weboack只会在nodemodules文件夹下面搜索你指定的loader，如果你的文件夹不在该目录下需要在config下面增加一项配置:  
即默认访问node_modules，你的文件夹不在的话就需要手动在配置文件里加上了。
```js  
    resolveLoader: {
        modules: ['node_modules', path.resolve(__dirname, 'loaders')]
    }
```   
ps：经过自身实践发现这样写是错的，不需要通过path去解析，直接将文件目录写入即可。    
一般来说loader都会发布到npm上进行管理，这种状况不用担心，但是开发阶段如果要自行测试，就面对这种情况了。   
例如，我手写的myloader在loaders下面，例子如下。  
```js   
     resolveLoader:{
        modules: ['node_modules','loader']
    }
```   
#### Examples   
就这么简单就是个普通的loader
```js  
    module.exports = function(source,map){
    this.cacheable && this.cacheable()
    this.value = source
    return '/*copy@ xiaoxiangdaiyu*/'+JSON.stringify(source)
    }
```   
#### 开发指南  

loader需要遵循以下事项。   
以下事项按优先级排列，第一条具有最高优先级。   

#### 一、单一任务    

loaders可以被链式调用，为每一步创建一个loader而非一个loader做所有事情  
也就是说，在非必要的状况下没有必要将他们转换为js。  

例如：通过查询字符串将一个字符串模板转化为html。   
如果你写了个loader做了所有事情那么你违背了loader的第一条要求。   
你应该为每一个task创建一个loader并且通过管道来使用它们  
* jade-loader: 转换模板为一个module   
* apply-loader: 创建一个module并通过查询参数来返回结果  
* html-loade: 创建一个处理html并返回一个string的模块   
 
#### 二、创建moulde话的模块，即正常的模块   

loader产出的module应该和遵循和普通的module一样的设计原则。  
举个例子，下面这样设计是不好的，没有模块化，依赖全局状态  
```js
    require("any-template-language-loader!./xyz.atl");
    var html = anyTemplateLanguage.render("xyz");
```  

#### 三、尽量表明该loader是否可以缓存  

大部分loaders是cacheable，所以应该标明是否cacheable。   
只需要在loader里面调用即可  
```js  
    // Cacheable identity loader
module.exports = function(source) {
	this.cacheable();
	return source;
};
```  

#### 四、不要在运行和模块之间保存状态     

* 一个loader相对于其他编译后的模块应该是独立的。 除非其可以自己处理这些状态  
* 一个loader相对于同一模块之前的编译过程应该是独立的。

#### 五、标明依赖   

如果该loader引用了其他资源（例如文件系统）， 必须声明它们。这些信息用来是缓存的loader失效并且重新编译它们  

```js  
    var path = require("path");
    module.exports = function(source) {
	this.cacheable();
	var callback = this.async();
	var headerPath = path.resolve("header.js");
	this.addDependency(headerPath);
	fs.readFile(headerPath, "utf-8", function(err, header) {
		if(err) return callback(err);
		callback(null, header + "\n" + source);
	});
};
```    

#### 六、解析依赖  

很多语言都提供了一些规范来声明依赖，例如css中的 @import 和 url(...)。这些依赖应该被模块系统所解析。  
##### 下面是两种解决方式：
* 1、将它们转化成require   
* 2、 用this.resolve方法来解析路径  

##### 下面是两个示例   

* 1、css-loader: 将依赖转化成require，即用require来替换@import和 url(...)，解析对其他样式文件的依赖  
* 2、less-loader: 不能像css-loader那样做，因为所有的less文件需要一起编译来解析变量和mixins。因此其通过一个公共的路径逻辑来扩展less编译过程。这个公共的逻辑使用this.resolve来解析带有module系统配置项的文件。例如aliasing, custom module directories等。  

如果语言仅仅接受相对urls（如css中url(file) 总是代表./file），使用~来说明成模块依赖.  
```js  
    url(file) -> require("./file")
    url(~module) -> require("module")
```  


#### 七、抽离公共代码  

extract common code  我感觉还是翻译成上面的标题比较好。其实所有语言都遵循该思想，即封装  
不要写出来很多每个模块都在使用的代码，在loader中创建一个runtime文件，将公共代码放在其中

#### 八、避免写入绝对路径  

不要把绝对路径写入到模块代码中。它们将会破坏hash的过程当项目的根目录发生改变的时候。应该使用loader-utils的 stringifyRequest方法来绝对路径转化为相对路径。   
例子：  
```js  
    var loaderUtils = require("loader-utils");
    return "var runtime = require(" +
    loaderUtils.stringifyRequest(this, "!" + require.resolve("module/runtime")) +
  ");";
```  

#### 九、使用peerDependencies来指明依赖的库 

使用peerDependency允许应用开发者去在package.json里说明依赖的具体版本。这些依赖应该是相对开放的允许工具库升级而不需要重新发布loader版本。简而言之，对于peerDependency依赖的库应该是松耦合的，当工具库版本变化的时候不需要重新变更loader版本。  

#### 十、可编程对象作为查询项  

有些情况下，loader需要某些可编程的对象但是不能作为序列化的query参数被方法解析。例如less-loader通过具体的less-plugin提供了这种可能。这种情况下，loader应该允许扩展webpack的options对象去获得具体的option。为了避免名字冲突，基于loader的命名空间来命名是很必要的。

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
  


