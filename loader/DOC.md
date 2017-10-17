## 如何开发一个loader  

#### 什么是loader  
  
loader是一个对面暴露一个方法的node包.当遇到某些资源需要被转换时调用该方法。  
在简单的情况下，只有一个loader来处理某个文件时，该loader被调用时只有一个参数，这个参数是该文件的内容转化之后的字符串。  

loader在function执行时可以通过this context来访问laoder API 以便更高效的开发。  

一个仅仅需要一个值的同步loader可以简单的return 自己。其他情况下，loader可以通过this.callback(err, values...)返回一系列的值。error同样传递给this.callback或者在loader中抛出。  

loader期望返回1-2个值，第一个是处理之后作为string或者buffer返回的js代码。第二个是SourceMap或者js 对象   
