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

  


