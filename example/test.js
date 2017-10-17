var path = require('path')
function test(){
    console.log('this is a simple loader')
    console.log(process.cwd())
    console.log(__dirname)
}
module.exports = test