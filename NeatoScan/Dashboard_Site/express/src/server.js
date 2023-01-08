const express=require("express");
const path=require("path");
const nunjucks=require("nunjucks");
const app=express();

app.use(express.static(path.resolve(__dirname,'assets')));

// configure
nunjucks.configure(path.resolve(__dirname,'views'),{
    express:app,
    autoscape:true,
    noCache:false,
    watch:true
}); 

app.get("/",(req,res)=>{
    res.render('index.html',{
        name:'nunjucks',
        data:{
            version:'3.2.1',
            licence:'Mozilla'
        },
    });
});  

app.listen(81,()=>{
    console.log("express server running on ", 81)
})