var fs = require('fs');

/*console.log('A');
var result = fs.readFileSync("node/sample2.txt",'utf8');
console.log('B');
console.log('C');*/

console.log('A');
fs.readFile("node/sample2.txt",'utf8',function(err,result){
    console.log(result);
});
console.log('C');