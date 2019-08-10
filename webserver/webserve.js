var http = require('http');
var fs = require('fs');

/*server = http.createServer(function(request,response){
    response.writeHead(200, {"Content-Type":"text/html;charset=utf-8"});
    response.end("웹서버로 부터 응답")
});
server.listen(3000);*/

var host = '192.168.35.141';
var port = 3000;

server.listen(port,host,5000,function(){
    console.log('웹서버 실행됨.');
});

server.on('connection',function(socket){
    console.log('클라이언트 접속했습니다.');
})

server.on('request',function(request,response){
    console.log('클라이언트 요청이 들어왔습니다');
  
    response.writeHead(200);
   // response.write("웹서버로부터 받은 응답");
    response.end('웹서버로 부터 받은 응답11');
    console.log("끝");
});