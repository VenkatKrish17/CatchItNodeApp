const express = require('express');
const bodyParser= require('body-parser')
const cors=require('cors')
const app = express();
const randomize = require('randomatic');
const MongoClient = require('mongodb').MongoClient
var db


app.use(bodyParser())
app.use(cors())
app.use(bodyParser.json());

var port = process.env.PORT || 3000;
MongoClient.connect('mongodb://admin:admin%408@ds143604.mlab.com:43604/catchit', (err, client) => {
  if (err) return console.log(err)
  db = client.db('catchit') // whatever your database name is
  app.listen(port, () => {
    console.log('listening on'+port)
  })
})

function validate_game_code(game_code){

    db.collection('game').find({'game_code':game_code,'status':'A'}).toArray((err,result)=>{
        console.log(result)
        if(err){
            return true;
        }
        if(result==undefined || result.length==0){
            return true
        }
        else {
            return false
        }
    })
}



app.get('/', function(req, res) {
    res.send('Hello World')
  })

app.post("/get_game",function(req,res){
    var info=req.body
    var game_code=info['game_code']
    var nick_name=info['nick_name']
    db.collection('game').findOne({'game_code':game_code,'status':'A'},(err,result)=>{
        console.log(result)
        if(err){
            return res.json({"status":false,"message":err.message})
        }
        if(result["participants"].indexOf(nick_name)>=0){
            return res.json({"status":false,"message":"Participant name already exist"})
        }
        game_info=result
        delete game_info['participants']
        if(result!=undefined ){
            db.collection('game').update({'game_code':game_code,'status':'A'},{$push:{'participants':nick_name}},(err,result)=>{
                if(err){
                    return res.json({"status":false,"message":err.message})
                }
                info_with_score=info
                info_with_score['score']=0
                db.collection("score").update(info,{$set:info_with_score},{upsert:true},(err,result)=>{
                if(err){
                    return res.json({"status":false,"message":err.message})
                    confirm.log(err)
                }
                return res.json({"status":true,"data":game_info})
            })
        })
            
        }
        else {
            return  res.json({"status":false,"message":"Invalid Game Code"})
        }
    })
})

app.post("/score",function(req,res){
    info=req.body
    score=info['score']
    delete info['score']
    db.collection("score").update(info,{$set:{'score':score}},{upsert:true},(err,result)=>{
        if(err){
            return res.json({"status":false,"message":err.message})
        }
        return res.json({"status":true,"data":game_info})
    })
})



app.get("/players/*",function(req,res){
    split_urls=req.originalUrl.split("/")
    game_code=split_urls[split_urls.length-1]
    db.collection('score').find({'game_code':game_code}).toArray((err,result)=>{
        console.log(result)
        if(err){
            return res.json({"status":false,"message":err.message})
        }
        
            return res.json({"status":true,"data":result})
        
    })
})


app.post('/game', function(req, res) {
    var info=req.body
    var date=new Date()
    info['game_time']=date
    info['status']="A"
    game_code=randomize('0',6)
    if(!validate_game_code(game_code)){
        game_code=randomize('0',6)
    }
    info['game_code']=game_code
    info['participants']=[]
     db.collection('game').save(info,(err,result)=>{
        if(err){
            return res.json({"status":false,"message":err.message})
        }
         console.log(result)
        res.json(info)
     })
  })

  app.post('/stop_game', function(req, res) {
    var info=req.body
    game_code=info['game_code']
    db.collection('game').update(info,{$set: {status:"D"}},(err,result)=>{
        if(err){
            return res.json({"status":false,"message":err.message})
        }
        console.log(result)
        db.collection('game').find({'game_code':game_code,'status':'D'}).toArray((err,result)=>{
            if(err){
                return res.json({"status":false,"message":err.message})
            }
            console.log(result)
            if(result!=undefined ){
                return res.json({"status":true,"data":result})
            }
            else{
                return res.json({"status":false})
            }
            
        })
   })
})

/*
create new user
*/
app.post("/user",(req,res)=>{
    var date=new Date()
    console.log(req)
    var info=req.body
    console.log(info)
    info['last_login']=date
    db.collection("users").findOne({'userid':info.userid},(err,result)=>{
        if(err){
            return res.json({"status":false,"message":err.message})
        }
        else{
           if(result!=undefined){
            return res.json({"status":false,"message":"User Id Exists! "})
           }
           else{
            db.collection("users").save(info,(err,result)=>{
                if(err){
                    return res.json({"status":false,"message":err.message})
                }
                else{
                    return res.json({"status":true,"message":"Welcome to Catch It!"})
                }
            })
           }
        }
    })

})

/*
login 
*/
app.post('/login', (req, res) => {
    var date=new Date()
    console.log(req)
    var info=req.body
    console.log(info)
    db.collection("users").findOne(info,(err,result)=>{
        if(err){
            return res.json({"status":false,"message":err.message})
        }
        
        else{
            console.log(result)
            if(result!=undefined){
                db.collection('game').find({'host_id':info.userid}).toArray((err,result)=>{
                    if(err) {
                         console.log(err)
                         return res.json({"status":true,"userid":info.userid,"games":result})
                    }
                    else{
                        if(result==undefined || result.length==0){
                            return res.json({"status":true,"userid":info.userid,"games":[]})
                        }
                        else {
                            return res.json({"status":true,"userid":info.userid,"games":result})
                        }
                        
                    }
                })
                // return res.json({"status":false,"message":"Participant name already exist"})
            }
            else{
                return res.json({"status":false,"message":"Invalid Credentials"})
            }
            
        }

    })

    // db.collection('user').update({'userid':info.userid},info,{upsert: true}, (err, result) => {
    //     if(err) {
    //         console.log(err)
    //         return res.json({"status":false,"message":err.message})
    //    }
    //    else{
        
        
    // }
    //   })
})