const redis = require('redis');
// Redis Connect
// woriking on this..............
const RedPORT = process.env.PORT || 6379;
var client = redis.createClient(RedPORT);
client.on("connect",(err,reply)=>{
  if (err) {
    console.log(err);
  }else{
    console.log("connected to redis successfully on PORT: "+ RedPORT);
  }
});


// Redis Cache middleware 
let RedCache = (req,res,next)=>{
    client.lrange("sell", 0, -1, (err, sell)=>{
     client.lrange("buy", 0, -1, (err, buy)=>{
       if (err) {
         throw err;
         next();
       } else {
           if (sell.length < 1 && buy.length < 1) {
               sell = " ";
               buy = " ";
               msg = "Enter some data in DB!";
               responseData(sell,buy,msg);
           } else {
            sell =sell;
            buy = buy;
            msg = " ";
            responseData(sell,buy,msg);
           }
        //  responseData(sell,buy);
       }
   });
   if (err) {
       throw err
       next();
     }
   });
   let responseData = (sell,buy,msg)=>{
           if (sell && buy) {
             res.render('index',{sellData:sell,buyData:buy,transactionSuccess:msg});
           } else {
             next();
           }
         }
   }//middleware ends here



   module.exports = RedCache;