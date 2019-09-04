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
var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit:10,
    host:'localhost',
    user:'testuser',
    password:'369369',
    database:'test',
    port:3306,
    debug:false
});

/*var connection = mysql.createConnection({
    host:'localhost',
    user:'testuser',
    password:'369369',
    database:'test'
});*/


var database;

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
 
        authUser(paramId,paramPassword,function(err,rows){
            if(err){
                console.dir(err);
                console.log('에러 발생');
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>에러 발생</h1>");
                res.end();
                return;
            }

            if(rows){
                console.dir(rows);
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
})

router.route("/process/adduser").post(function(req,res){
    console.log('/process/addUser 라우팅 함수 호출됨.');

    var paramId= req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    var paramAge = req.body.age || req.query.age;
    
    console.log(`요청 파라미터 ${paramId} ${paramPassword} ${paramName} ${paramAge}`);
    paramAge = parseInt(paramAge);
    addUser(paramId,paramName,paramAge,paramPassword,function(err,addedUser){
        if(err)
        {
            console.dir(err);
            console.log("에러 발생.");
            res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
            res.write('<h1>에러 발생</h1>');
            res.end();
            return;
        }

        if(addedUser)
        {
            console.dir(addedUser);
            res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
            res.write('<h1>사용자 추가 성공</h1>');
            res.end();
        }
        else
        {
            console.log("에러발생.");
            res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
            res.write('<h1>사용자 추가 실패</h1>');
            res.end();
        }
    })
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

var addUser = function(id,name,age,password,callback){
    console.log('addUser 호출됨.');

    pool.getConnection(function(err,conn){
        if(err){
            if(conn)
            {
                conn.release();
            }
            callback(err,null);
            return;
        }
        console.log("데이터베이스 연결의 스레드 아이디 : "+ conn.threadId);
        var data = {id:id, name:name, age:age, password:password};
        var exec = conn.query("insert into student set ?",data,function(err,result){
            conn.release();
            console.log("실행된 SQL" + exec.sql);

            if(err){
                console.log("SQL 실행 시 에러 발생");
                callback(err,null);
                return;
            }
        });
    })
    /*connection.connect(function(err){
        if(err){
            console.log("연결 실패");
            return;
        }
        
    });*/
}
 

var authUser = function(id,password,callback){
    console.log("author 호출됨 "+id+" "+password);

    pool.getConnection(function(err,conn){
        if(err){
            if(conn){
                conn.release();
            }
            callback(err,null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디 : '+conn.threadId);
        var tablename = 'student';
        var columns = ['id','name','age'];
        var exec = conn.query("select ?? from ?? where id = ? and password = ?",
        [columns,tablename,id,password],function(err,rows){
            conn.release();
            console.log("실행된 SQL : " + exec.sql);

            if(err){
                callback(err,null);
                return;
            }

            if(rows.length>0){
                console.log('사용자 찾음');
                callback(null,rows);
            }
            else{
                console.log('사용자 찾지 못함.');
                callback(null,null);
            }
        });
    })

} //로그인 관련 함수



var errorHandler = expressErrorHandler({
    static:{
        '404':'/404.html'
        }
})



var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : " + app.get('port'));

});