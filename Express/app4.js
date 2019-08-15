var express = require('express');
var http = require('http');
var static = require('serve-static');
var path = require('path');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var multer = require('multer'); //파일 업로드를 도와주는 외장모듈
var fs = require('fs');
var cors = require('cors') // 다중접속 해결

var app = express();

app.set('port', process.env.PORT || 3000); //port 정보 설정
app.use(static(path.join(__dirname,'public')));
app.use(static(path.join(__dirname,'upload')));

//app.use(express.static(__dirname+'/public'))
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()); // post방식을 처리하기 위해서 2줄을 써준다.

app.use(cookieParser());
app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true
}));

app.use(cors());

var storage = multer.diskStorage({
    destination:function(req,file,callback){
        callback(null,'uploads')//업드로드한 파일이 uploads 폴더에 들어간다.
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

var router = express.Router();
app.use('/',router);//router 객체 등록

router.route('/process/p').post(upload.array('p',1),function(req,res){
    console.log('/process/photo 라우팅 함수 호출됨');

    var files = req.files;
    console.log('=== 업로드된 파일 ===');
   /* if(files.length>0){
        console.dir(files[0])
    }
    else{
        console.log('업로드된 파일이 없습니다.')
    }*/
    res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
    res.write("<h1>파일 업로드 성공</h1>");
})

router.route('/process/product').get(function(req,res){
    if(req.session.user){  
        res.redirect('/product.html')
    }
    else{
        res.redirect('/login.html')
    }
})
router.route('/process/setUserCookie').get(function(req,res){
    console.log('/process/setUserCookie 라우팅 함수 호출됨.');
    res.cookie('user',{
        id:'mike',
        name:'소녀시대',
        authorized:true
    });
    res.redirect('/process/showCookie');
});

router.route('/process/showCookie').get(function(req,res){
    console.log('/process/showCookie 라우팅 함수 호출됨.');

    //res.writeHead(200);
    //res.end(req.cookies);
    res.send(req.cookies);
})
router.route('/process/login').post(function(req,res){
    console.log("login");

    //var p = req.params.name;
    var name = req.body.name || req.query.name;
    var password = req.body.password || req.query.password;
    console.log(`name : ${name} , password : ${password}`);

    if(req.session.user){
        console.log('이미 로그인 되어 있습니다.');
        res.redirect('/product.html');
    }
    else{
        req.session.user = {
            id:name,
            name:'소녀시대',
            authorized:true
        }
    }
    res.writeHead(200,{'Content-Type':'text/html;charset=utf8'});
    res.write('<h1>로그인 성공</h1>')
    res.write(`<p>Id : ${name} </p>`)
    res.write(`<br><br><a href="/product.html">상품페이지 이동</a>`);
    res.end();
    /*res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
    res.write("<h1>서버에서 로그인 응답</h1>");
    res.write(`<div><p>${name}</p></div>`);
    res.write(`<div><p>${password}</p></div>`);
    res.write(`<div><p>${p}</p></div>`)
    res.end();*/
});

router.route('/process/logout').get(function(req,res){
    if(req.session.user){
        console.log('로그아웃 합니다.');

        req.session.destroy(function(err){
            if(err){
                console.log('세션 삭제시 에러 발생');
                return;
            }
            else{
                console.log('세션삭제 성공');
                res.redirect('/login.html');
            }
        });
    }
    else{
        console.log('로그인 되어 있지 않습니다.');
        res.redirect('/login.html');
    }
})

app.use(function(req,res,next){  //미들웨어는 클라이언트의 요청을 처리한다.
    console.log('첫번째 미들웨어 호출됨.');
    
    var userAgent = req.header('User-Agent');
    var paraname = req.body.name || req.query.name;

    res.send("UserAgent => "+userAgent+'\nParaname => '+paraname);
    });


app.all('*',function(req,res){
    /*res.writeHead(404,{"Content-Type":"text/html;charset=utf8"});
    res.write(`<h1>요청하신 페이지는 없어요</h1>`);
    res.end();*/ 
    res.status(404).send(`<h1>요청하신 페이지는 없어요</h1>`);
});




var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : " + app.get('port'));
});