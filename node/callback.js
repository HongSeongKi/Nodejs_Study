/*function a(){
    console.log('A')
}
a()*/

var a = function(){
    console.log('AB');
}

function slowFunc(callback)
{
    callback();
}
slowFunc(a);