var http = require("http");
var fs = require("fs");
var url = require("url");
var qs = require("querystring");
var path = require("path");

function templateHtml(title,list,body)
{
    var template = `
    <!doctype html>
    <html>
    <head>
        <title>WEB - ${title}</title>
    </head>
    <body>
        <h1><a href="/">WEB</a></h1>
        ${list}
        <a href="/create">create</a>
        ${body}
    </body>
    </html>
    ` ;
    return template;
}

function templateList(data)
{
    var list = "<ul>";
    for(var i =0;i<data.length;i++)
        list = list+ `<li><a href="/?id=${data[i]}">${data[i]}</a></li>`;
    list = list+"</ul>";
    return list; 
}

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url,true).query;
    var pathname = url.parse(_url,true).pathname;
    if(pathname === '/')
    {
        if(queryData.id === undefined) // 처음 메인페이지
        {
            fs.readdir("./data",function(err,filelist){
                var title = "Welcome";
                var list = templateList(filelist);
                var body="Main page";
                var template = templateHtml(title,list,body);
                response.writeHead(200);
                response.end(template);
            })
        }
        else
        {
            fs.readdir("./data",function(err,filelist){
                var title = queryData.id;
                var list = templateList(filelist);
                fs.readFile(`./data/${title}`,function(err,data){
                    var body = data;
                    body=body+`
                    <form action="/delete_process" method="post">
                        <input type="hidden" name="id" value=${title}>
                        <input type="submit" value="delete">
                    </form>
                    `;
                    var template = templateHtml(title,list,body);
                    response.writeHead(200);
                    response.end(template);
                })
            });
        }
    }
    else if(pathname === '/create')
    {
        fs.readdir("./data",function(err,filelist){
            var title = queryData.id;
            var list = templateList(filelist);
            var body = `
            <form action="/create_process" method="post">
                <p>
                <input type="text" name = "title" placeholder="text">  
                </p>
                <p>
                <textarea name = 'description'></textarea>
                </p>
                <p>
                <input type='submit'>
                </p>
            </form>
            `
            var template = templateHtml(title,list,body);
            response.writeHead(200);
            response.end(template);
        })
    }
    else if(pathname === '/create_process')
    {
        var body = "";
        var post;

        request.on('data',function(data){
            body = body + data;
        });
        
        request.on('end',function(){
            post=qs.parse(body);
            console.log(post);
            var title = post.title;
            var description = post.description;
            console.log(title, description);
            fs.writeFile(`./data/${title}`,description,'utf8',function(err){
                response.writeHead(302,{Location:`/?id=${title}`});
                response.end();
            });
        });
        //response.end(template);
    }
    else if(pathname==='/delete_process')
    {
        var body="";
        var post="";
        request.on('data',function(data){
            body =body+data;
        })

        request.on('end',function(){
            console.log(body);
            post = qs.parse(body);
            var title = post.id;
            console.log(title);
            fs.unlink(`./data/${title}`,function(err){
                response.writeHead(302,{Location:`/`});
                response.end();
            });
           
        })
       
    }
    else{
        response.writeHead(404);
        response.end("Not Found");
    }
   
   
});
app.listen(4000);