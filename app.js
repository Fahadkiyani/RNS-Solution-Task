const express = require('express');
const app = express();
const path = require('path')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const redis = require('redis');
require("dotenv/config");
const order = require('./schema/orderschema');
const { userInfo } = require('os');
const orders = require('./schema/orderschema');
const { json } = require('body-parser');
const bst = require('./bst');
const { connect } = require('http2');


app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use('/static', express.static(path.join(__dirname, 'public')))

// DB data fetch to store in cache
// Working on this..........

// Redis Connect
// woriking on this..............
const RedPORT = process.env.PORT || 6379;
var client = redis.createClient(RedPORT);
client.on("connect",(err,reply)=>{
  if (err) {
    console.log(err);
  }else{
    console.log("connected to redis successfuly."+ RedPORT);
  }
})


// ************Get Requests
app.get('/',(req,res)=>{
  orders.find({},(err, data)=>{
    res.render('index',{data:data})
  })
})


// **********Post Requests
app.post('/',(req,res)=>{
  let formData = req.body;
  const side = req.body.side;
  const price = req.body.price;

  // request params assigned to model keys
  const order = new orders({
    side:side,
    price:price
  });
  
  if (side === "sell") {
    // Matching, saving and deleting data in redis.
    client.lrange('buy',0,-1, (err,reply)=>{
      if (err) {
        console.log(err);
      } else {
        reply.forEach(element => {
          if (price === element) {
            console.log('req price matched with Redis db price');
            client.flushall(function (err, d) {
              if (err) {
                console.log(err);
              } else {
                console.log("successfully reached the end point"+d);
              }})
          } else {
            console.log("could not find the price in redisDB");
            client.lpush("sell",price);
          }
        });
      }
    });
    // Matching, saving and deleting data in redis.
    orders.findOne({side:"buy",price:price},(err,data)=>{
      if (data === null) {
        console.log("data does not exist in database");
        order.save().then((data)=>{
          console.log("you enter the " + data + " to database");
          orders.find({},(err, data)=>{
            res.render('index',{data:data})
          })
        }).catch(err =>{ throw err});
        
      }else{
        console.log("Your Sell order is successfull");
        orders.deleteMany({__v:0}).then(function(){
          console.log("Data deleted"); // Success
          let data = [{side:"trade",price:"successful"}];
           res.render('index',{data:data});
        }).catch(function(error){
          console.log(error); // Failure
      });
      }
    });

    }else if(side === "buy"){
      // saving incoming buy data to redis Database.
      client.lrange('sell',0,-1,(err,reply)=>{
        if (err) {
          console.log(err);
        } else {
          reply.forEach(element => {
            if (price === element) {
              console.log('req price matched with db price');
              client.flushall();
            } else {
              console.log("could not find the price in db");
              client.lpush("buy",price);
            }
          });
        }
      });//Redis Ends Here.

      // matching, saving and deleting data on cloud.
      orders.findOne({side:"sell",price:price},(err,data)=>{
        if (data === null) {
          console.log("data does not exist in database");
          order.save().then((data)=>{
            console.log("you enter the " + data + " to database");
            orders.find({},(err, data)=>{
              res.render('index',{data:data})
            })
          }).catch(err =>{ throw err});
        }else{
          console.log("Your Buy order is successfull");
          orders.deleteMany({__v:0}).then(function(){
            console.log("Data deleted"); // Success
            let data = [{side:"trade",price:"successful"}];
             res.render('index',{data:data});
          }).catch(function(error){
            console.log(error); // Failure
        });
          
        }
      });
      // 
    }
});
  
  
// Start Server at PORT 3000
let port = process.env.PORT || 3000;
app.listen(port,()=>{
  console.log(`The server is running on localhost:${port}`);
})

// Cloud Database Connect
const ConnectMongoose = async ()=>{
  try{
    await mongoose.connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    keepAlive: true,
  })

  console.log(`\nConnected to Cloud Database `)
} catch(error) {console.log(error)};
mongoose.Promise = global.Promise;
}
ConnectMongoose();