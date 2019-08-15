var express = require('express');
var http = require('http');
var static = require('serve-static');
var path = require('path');
var bodyParser =require('body-parser');
var fs = require('fs');
var url = require('url');
var qs = require("querystring");
var expressSession = require('express-session');

var app = express();
var router = express.Router();

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()); // post방식을 처리하기 위해서 2줄을 써준다.


app.use('/',router); //router 등록
app.set('port',process.env.PORT || 3000);
app.use(static(path.join(__dirname,'public')));


router.route('/process').get(function(req,res){
    console.log("process화면 입니다.");
    //var _url = req.url;
    //var queryData = url.parse(_url,true).query;
   var queryData = req.query;
    console.log(queryData);
    fs.readFile('./public/login.html',function(err,data){
        res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
        res.write(data);
        res.end();
    })
});

var urlencodedParser = bodyParser.urlencoded({extended:false});
router.route('/process/login').post(function(req,res){
    console.log('/process/login');
    var queryData = req.body;
    console.log(req.body);
   // res.writeHead(200,{"Content-Type":"application/json;charset=utf8"});
    res.end("/process/login");
})

app.all('*',function(req,res){
    res.writeHead(404,{"Content-Type":"text/html;charset=utf8"});
    res.write('<h1>요청하신 페이지는 없어요</h1>');
    res.end();
});

var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : "+app.get('port'));
})

