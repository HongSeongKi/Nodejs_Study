var express = require('express');
var http = require('http');
var static = require('serve-static');
var path = require('path');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var fs = require('fs');
var expressErrorHandler = require('express-error-handler');
var mongoose = require('mongoose'); //몽구스

var database;
var UserSchema;
var UserModel;

function connectDB(){
    var databaseUrl = 'mongodb://localhost:27017/local';//local은 db이름
    
    mongoose.Promise = global.Promise;
    mongoose.connect(databaseUrl);
    database = mongoose.connection;
    
    database.on('open',function(){
        console.log('데이터베이스에 연결됨 : ' + databaseUrl);

        UserSchema = mongoose.Schema({
            id: {type : String, required:true, unique:true},
            password:{type:String, required:true},
            name:{type:String, index:'hashed'}, //index만들기
            age: {type:Number, 'default':-1}, //값을 안넣으면 기본값으로 -1
            created_at:{type:Date, index:{unique:false},'default':Date.now()},
            update_at:{type:Date, index:{unique:false},'default':Date.now()}
        }); //자신이 정한 속성들의 해당하는 값을 넣겠다고 정의 , 스키마객체 반환, table정의라고 생각
        
        UserSchema.static('findById',function(id,callback){
            return this.find({id:id},callback);
        })
        /*UserSchema.statics.findById = function(id,callback){
            return this.find({id:id},callback)
        } 
        또다른 방식 */
        
        UserSchema.static('findAll',function(callback){
            return this.find({},callback);
        })
         //함수를 등록
        console.log('UserSchema 정의함.');
        UserModel = mongoose.model('users2',UserSchema) //모델 정의
        console.log('UserModel 정의함');
    }) //연결되었을 떄 요청됨
    
    database.on('disconnected',function(){
        console.log('데이터베이스 연결 끊어짐');
    });

    database.on('error',console.error.bind(console, 'mongoose 연결 에러.'));

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
    var person = { id:paramId,password:paramPassword};
    var person_str = JSON.stringify(person);
    console.log("객체"+person);
    console.log("문자"+person_str);
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

router.route('/process/listuser').post(function(req,res){
    console.log('/process/listuser 라우팅 함수 호출됨');

    if(database){
        UserModel.findAll(function(err,results){
            if(err){
                console.log("에러발생!");
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h1>에러 발생</h1>");
                res.end();
                return;
            }  
            
            if(results){
                console.dir(results);
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("<h3>사용자 리스트</h3>");
                res.write("<div><ul>");
                for(var i = 0;i<results.length;i++)
                {
                    var curId = results[i]._doc.id;
                    var curPassword = results[i]._doc.password;
                    var curName = results[i]._doc.name;
                    var list = `<li>curId : ${curId} , curPassword : ${curPassword} , curName : ${curName}</li>`
                    res.write(list);
                }
                res.write("</ul></div>")
            }
            else{
                console.log("에러발생");
                res.writeHead(200,{"Content-Type":"type/html;charset=utf8"});
                res.write("<h3>조회된 자료 없음</h3>");
                res.end();
            }
        })
    }else{
        console.log("에러 발생");
        res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
        res.write("<h1>데이터베이스 연결 안됨</h1>");
        res.end();
    }
})

app.use('/',router);//router 객체 등록

var authUser = function(db,id,password,callback){
    console.log("author 호출됨 "+id+" "+password);
    UserModel.findById(id,function(err,results){
        if(err){
            callback(err,null);
            return;
        }

        console.log('아이디 %s로 검색됨.');
        if(results.length>0){
            if(results[0]._doc.password === password)
            {
                console.log("비밀번호 일치함.");
                callback(null,results);
            }else{
                console.log("비밀번호 일치하지 않음");
                callback(null,null);
            }
        }else{
            console.log("아이디 일치하는 사람 없음");
            callback(null,null);
        }
    })
} //참조

var addUser = function(db,id,password,name,callback)
{
    console.log(`addUser 호출됨 => id : ${id} , password : ${password}`);

    var user = new UserModel({"id":id,"password":password,"name":name});
    user.save(function(err){
        if(err){
            callback(err,null);
            return;
        }

        console.log("사용자 데이터 추가함");
        callback(null,user);
    });
} //추가

/* update
UserModel.where({id:'test01'}).update({name:'애프터스쿨'}),function(err){})
where에 있는 것을 참조해서 update안에 있는 속성 값을 update한다.
 */


var errorHandler = expressErrorHandler({
    static:{
        '404':'/404.html'
        }
})



var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : " + app.get('port'));
    connectDB();
});

/*var host = "192.168.35.238"
var port = "3000";
var server = http.createServer(function(req,res){
    console.log("웹 서버 실행됨1.")
    connectDB();
})

server.listen(port);*/