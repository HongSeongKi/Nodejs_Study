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
var multer = require("multer");
var cors = require("cors");
var BinaryFile = require('binary-file');

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
            id:{type:String,required:true,unique:true},
            title: {type : String, required:true},
            content:{type:String, required:true},
            picture:{type:String},
            comment:{type:Array}
        }); //자신이 정한 속성들의 해당하는 값을 넣겠다고 정의 , 스키마객체 반환, table정의라고 생각
        
        UserSchema.static('findById',function(id,callback){
            return this.find({id:id},callback);
        })
        
        UserSchema.static('findAll',function(callback){
            return this.find({},callback);
        }) //전체 리스트 조회
        
        //함수를 등록
        console.log('UserSchema 정의함.');
        UserModel = mongoose.model('users2',UserSchema) //모델 정의
        //UserModelTwo = mongoose.model();
        //UserModelThree = mongoose.model();
        console.log('UserModel 정의함');
    }) //연결되었을 떄 요청됨
    
    database.on('disconnected',function(){
        console.log('데이터베이스 연결 끊어짐');
    });

    database.on('error',console.error.bind(console, 'mongoose 연결 에러.'));

}

var storage = multer.diskStorage({
    destination:function(req,file,callback){
        callback(null,'public')//업드로드한 파일이 public 폴더에 들어간다.
    },
    filename:function(req,file,callback){ 
        var extension = path.extname(file.originalname); //확장자
        var basename = path.basename(file.originalname,extension);//파일이름
        callback(null,basename + Date.now() + extension);
    }
});

var upload = multer({
    storage:storage,
    limits:{
        files:10,
        fileSize:1024*1024*1024
    }
});

var app = express();

app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))

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

router.route('/list').get(function(req,res){ //게시판 전체 보여주기
    console.log('/list 라우팅 함수 호출됨');

    if(database){
        UserModel.findAll(function(err,results){
            if(err){
                console.log("에러발생!");
                res.write("에러발생!");
                res.end();
                return;
            }  
            if(results){
                var array = new Array();
                console.log("result 존재")
                for(var i = 0;i<results.length;i++)
                {
                    var curTitle = results[i]._doc.title;
                    var curContent = results[i]._doc.content;
                    var curCommentlength = results[i]._doc.comment.length;
                    var info = {
                        "title" : curTitle,
                        "content" : curContent,
                        "commentlength" : curCommentlength
                    };
                    //var info_str = JSON.stringify(info);
                    array[array.length] = info;
                }
                var info = {
                    "info" : array
                };
                var info_str = JSON.stringify(info);
                res.write(info_str);
            }
            else{
                console.log("result 에러 발생");
                res.write("result 에러 발생");
                res.end();
            }
        })
    }else{
        console.log("에러 발생");
        res.write("데이터베이스 연결 안됨");
        res.end();
    }
})


router.route("/add").post(function(req,res){ //게시판 추가
    console.log('/add 라우팅 함수 호출됨.');
   
    
    var paramId = req.body.id || req.query.id;
    var paramTitle = req.body.title || req.query.title;
    var paramContent = req.body.content || req.query.content;
    var paramImage = req.body.image || req.query.image;
    console.log(`paramId : ${paramId}`);
    console.log(`paramTitle : ${paramTitle}`);
    console.log(`paramContent : ${paramContent}`);
    //console.log(`paramImage : ${paramImage}`);
    var com ={
        id : paramId,
        title : paramTitle,
        content : paramContent,
        image : paramImage
    };
    var com_str = JSON.stringify(com);
    res.write(com_str);
    res.end();
   // console.log(`요청 파라미터 : ${paramId}, ${paramPassword}, ${paramName}`);

    /*if(database){
        addUser(database,paramId,paramPassword,paramName,function(err,result){
            if(err){
                console.log('에러 발생');
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write("에러 발생");
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
    }*/
})

router.route("/process/update").get(function(req,res){ //게시판 업데이트
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

