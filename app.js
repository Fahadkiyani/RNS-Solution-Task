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


app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use('/static', express.static(path.join(__dirname, 'public')))

// DB data fetch to store in cache


// Redis Connect
const RedPORT = process.env.PORT || 6379;
const client = redis.createClient(RedPORT);// woriking on this..............

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
    // 
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
    // 
    }else if(side === "buy"){
      // 
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
  
  



// ******************************************************Start Server at PORT 3000
let port = process.env.PORT || 3000;
app.listen(port,()=>{
  console.log(`The server is running on localhost:${port}`);
})

// ******************************************************Database Connect
mongoose.connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    keepAlive: true,
  })
  .then(() => console.log(`\nMongodb is connected `))
  .catch((error) => console.log(error));
mongoose.Promise = global.Promise;

