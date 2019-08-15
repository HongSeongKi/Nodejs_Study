var express = require('express');
var http = require('http');
var static = require('serve-static');
var path = require('path');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var fs = require('fs');
var expressErrorHandler = require('express-error-handler');
var MongoClient = require('mongodb').MongoClient; //몽고디비

var database;

function connectDB(){
    var databaseurl = 'mongodb://localhost:27017/local';
    MongoClient.connect(databaseurl,{ useNewUrlParser: true },{ useUnifiedTopology: true },function(err,db1){
        if(err){
            console.log("데이터베이스 연결 시 에러 발생");
            return;
        }
        console.log("데이터베이스 연결됨: "+databaseurl);
        database = db1.db('local');
       // console.log(database);
    }); //디비연결
}
var app = express();

app.set('port', process.env.PORT || 3000); //port 정보 설정
app.use(static(path.join(__dirname,'public')));


//app.use(express.static(__dirname+'/public'))
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()); // post방식을 처리하기 위해서 2줄을 써준다.

app.use(cookieParser());
app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true
}));

var router = express.Router();


router.route('/process/login').post(function(req,res){
    console.log('/process/login 라우팅 함수 호출됨');

    var paramId = req.body.name;
    var paramPassword = req.body.password;
    console.log(`요청 파라미터 : id = ${paramId} , password = ${paramPassword}`);
   // console.log(database);
    if(database){
        authUser(database,paramId,paramPassword,function(err,docs){
            if(err){
                console.log('에러 발생');
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>에러 발생</h1>");
                res.end();
                return;
            }

            if(docs){
                console.dir(docs);
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>사용자 로그인 성공</h1>");
                res.write(`<div><p>사용자 : ${docs[0].name}</p></div>`)
                res.write(`<br><br><a href="/login.html">다시 로그인 하기</a>`);
                res.end();
            }
            else{
                console.log('에러 발생');
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>사용자 데이터 조회안됨</h1>");
                res.end();
            }
        });
    }
    else
    {
        console.log("데이터베이스 오류");
        res.writeHead(200);
        res.write("database error");
        res.end();
    }
})

router.route("/process/adduser").post(function(req,res){
    console.log('process/adduser 라우팅 함수 호출됨.');

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;

    console.log(`요청 파라미터 : ${paramId}, ${paramPassword}, ${paramName}`);

    if(database){
        addUser(database,paramId,paramPassword,paramName,function(err,result){
            if(err){
                console.log('에러 발생');
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>에러 발생</h1>");
                res.end();
                return;
            }
            if(result){
                console.dir(result);

                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>사용자 추가 성공</h1>");
                res.write(`<div><p>사용자 : ${paramName}</p></div>`)
                res.end();
            }
            else{
                console.log('에러 발생');
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>사용자 추가 안됨</h1>");
                res.end();

            }
        })
    }
    else{
        console.log('에러 발생');
        res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
        res.write("<h1>데이터베이스 연결 안됨</h1>");
        res.end();
        return;
    }
})

router.route("/process/update").post(function(req,res){
    var data = req.body;
    var id = data.id;
    var password = data.password;
    var name = data.name;
    if(database){
        updateUser(database,id,password,name,function(err){
            if(err)
            {
                console.log("에러존재");
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>name 변경 실패</h1>");
                res.end();
            }
            else{
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>name 변경 성공</h1>");
                res.end();
            }
        });
    }
    else{
        console.log("데이터베이스 존재 하지 않습니다.")
    }
})

app.use('/',router);//router 객체 등록

var authUser = function(db,id,password,callback){
    console.log("author 호출됨 "+id+" "+password);
    var users = db.collection('users');

    users.find({"id":id,"password":password}).toArray(function(err,docs){ //배열로 변환
        if(err){
            callback(err,null);
            return;
        }
        if(docs.length>0)
        {
            console.log("일치하는 사용자를 찾음");
            callback(null,docs);
        }
        else{
            console.log("일치하는 사용자를 찾지 못함");
            callback(null,null);
        }
    });//배열로 바꾸기

} //로그인 관련 함수

var addUser = function(db,id,password,name,callback)
{
    console.log(`addUser 호출됨 => id : ${id} , password : ${password}`);
    var users = db.collection("users");
    var arr = [{"id":id,"password":password,"name":name}]
    users.insertMany(arr,function(err,result){
        if(err){
           callback(err,null);
           return;
        }
        if(result.insertedCount>0){
            console.log('사용자 추가됨:' + result.insertedCount);
            callback(null,result);
        }
        else{
            console.log("추가된 레코드가 없음");
            callback(null,null);
        }
    });
}

var updateUser = function(db,id,password,name,callback)
{
    console.log(`id : ${id} , password: : ${password}, name : ${name}`);
    console.log("update 호출됨 ");
    var users = db.collection("users");
    
    users.updateOne({"id":id},{$set:{"name":name}},function(err){
        if(err)
        {
           callback(err);
        }
        else{
            callback(null);
        }
        })
}

var errorHandler = expressErrorHandler({
    static:{
        '404':'/404.html'
        }
})



var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : " + app.get('port'));
    connectDB();
});