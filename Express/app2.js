var express = require('express');
var http = require('http');

var app = express();
app.set('port', process.env.PORT || 3000); //port 정보 설정

app.use(function(req,res,next){  //미들웨어는 클라이언트의 요청을 처리한다.
    console.log('첫번째 미들웨어 호출됨.');

    res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
    res.end("웹서버에서의 응답");
})
var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : " + app.get('port'));
});