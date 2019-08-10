var express = require('express');
var http = require('http');

var app = express();
app.set('port', process.env.PORT || 3000); //port 정보 설정

app.use(function(req,res,next){  //미들웨어는 클라이언트의 요청을 처리한다.
    console.log('첫번째 미들웨어 호출됨.');
    req.user = 'mike';
    next();
});

app.use(function(req,res,next){
    console.log('두번째 미들웨어 호출됨')
   // res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
    //res.end("웹서버에서의 응답 : "+req.user);
    //res.send("웹서버에서의 응답") => send는 writeHead와 end를 합친것이다.
    var person = {name : "소녀시대",age:20};
  //  res.send(person);
    
    var personStr = JSON.stringify(person);
    //res.send(personStr);

    res.writeHead('200',{"Content-Type":"application/json;charset=utf8"});
    res.write(personStr);
    res.end();
});
var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : " + app.get('port'));
});