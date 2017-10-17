module.exports = function(source,map){
    this.cacheable && this.cacheable()
    this.value = source
    return '/*copy@ xiaoxiangdaiyu*/'+JSON.stringify(source)
}