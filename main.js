var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require("path");

var template ={
  HTML:function(title,list,body,update){
    var template = `
    <!doctype html>
    <html>
    <head>
      <title>WEB1 - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1><a href="/">WEB</a></h1>
      ${list}
      <a href="/create">create</a>
      ${update}
      ${body}
    </body>
    </html>
    `;
    return template;
  },
  list: function(filelist){
    var list = '<ul>'
    var i = 0;
    while(i<filelist.length)
    {
      list = list+`<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
      i=i+1;
    }
    list = list+'</ul>';
    return list;
  }
};

function templateHTML(title,list,body,update){
  var template = `
  <!doctype html>
  <html>
  <head>
    <title>WEB1 - ${title}</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1><a href="/">WEB</a></h1>
    ${list}
    <a href="/create">create</a>
    ${update}
    ${body}
  </body>
  </html>
  `;
  return template;
}

function templateList(filelist){
  var list = '<ul>'
  var i = 0;
  while(i<filelist.length)
  {
    list = list+`<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
    i=i+1;
  }
  list = list+'</ul>';
  return list;
}

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url,true).query;
    //console.log(queryData);
    var title = queryData.id;
    //console.log(url.parse(_url,true));
    var pathname = url.parse(_url,true).pathname;
    
    if(pathname === '/')
    {
      if(queryData.id === undefined)
      {
          fs.readdir('./data',function(error,filelist){
            console.log(filelist);
            title = "Welcome";
            data = "Hello Node.js";

            var list = templateList(filelist);
            var body = `<h2>${title}</h2>${data}`;
           // var template = templateHTML(title,list,body,"");
            html = template.HTML(title,list,body,"");
            response.writeHead(200);
            response.end(html);
          })
        }
      else
      {
        title = queryData.id;
        fs.readdir('./data',function(error,filelist){
          console.log(filelist);
          var filtered = path.parse(title).base;
          console.log(filtered);
          console.log(title);
          var list = templateList(filelist);
            fs.readFile(`data/${filtered}`,'utf8',function(err,data){
            var body = `<h2>${title}</h2>${data}`;
            var update = `<a href="/update?id=${title}">update</a>
                          <form action="/delete_process" method="post">
                            <input type="hidden" name="id" value="${title}">
                            <input type="submit" value="delete">
                          </form>
                            `
          //var template = templateHTML(title,list,body,update);
          var html = template.HTML(title,list,body,update);
          response.writeHead(200);
          response.end(html);
          });
        });
      }
    }
    else if(pathname === '/create')
    {
      fs.readdir('./data',function(error,filelist){
        console.log(filelist);
        title = "Web - create";
        data = "Hello Node.js";

        var list = templateList(filelist);
        var body1 = `<form action='http://localhost:3000/create_process' method='post'>   
        <p><input type='text' name='title' placeholder="text"></p>
        <p>
            <textarea name='description'></textarea>
        </p>
        <p>
            <input type='submit'>
        </p>
    </form>;` 

        var template = templateHTML(title,list,body1,"");
        response.writeHead(200);
        response.end(template);
      })
    }
    else if(pathname === '/create_process')
    {
      var body="";
      var post;
      request.on('data',function(data){
        body = body+data;
      });

      request.on('end',function(){
        post = qs.parse(body);
        console.log(post);
        var title = post.title;
        var description = post.description;
        fs.writeFile(`data/${title}`,description,'utf8',function(err){
        response.writeHead(302,{Location:`/?id=${title}`});
        response.end();
         })
      });
    }
    else if(pathname === '/update')
    {
      title = queryData.id;
      fs.readdir('./data',function(error,filelist){
        console.log(filelist);
        var list = templateList(filelist);
          fs.readFile(`./data/${title}`,'utf8',function(err,data){
          var body = `<form action='/update_process' method='post'>
          <input type='hidden' name='id' value=${title}>   
          <p><input type='text' name='title' placeholder="text" value=${title}></p>
          <p>
              <textarea name='description'>${data}</textarea>
          </p>
          <p>
              <input type='submit'>
          </p>
      </form>;` 
        
        //var template = templateHTML(title,list,body,"");
        html = template.HTML(title,list,body,"")
        response.writeHead(200);
        response.end(html);
        });
      });
    }
    else if(pathname === '/update_process')
    {
      var body="";
      request.on('data',function(data){
        body = body+data;
      });

      request.on('end',function(){
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var description = post.description
        fs.rename(`./data/${id}`,`./data/${title}`,function(err){
        fs.writeFile(`./data/${title}`,description,'utf8',function(err){
          response.writeHead(302,{Location:`/?id=${title}`});
          response.end();
        });
     
        });
      
      })  
    }
    else if(pathname==='/delete_process')
    {
      var body="";
      request.on('data',function(data){
        body = body+data;
      });

      request.on('end',function(){
        var post = qs.parse(body);
        var id = post.id;
        fs.unlink(`data/${id}`,function(err){
          response.writeHead(302,{Location:`/`});
          response.end();
        });

      });
    }
    else{
      response.writeHead(404);
      response.end("Not Found");
    }
});

app.listen(3000);
