const express = require('express');
const app = express();
const path = require('path')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require("dotenv/config");
const bst = require('./bst');
const redis = require('redis');
const RedCache = require('./middleware/RedCache')


// Middleware Imports
// const order = require('./schema/orderschema');
const orders = require('./schema/orderschema');
const BST_SAVE_DATA = require('./middleware/savedatatodb');
const { add } = require('./bst');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');
app.use('/static', express.static(path.join(__dirname, 'public')))

// DB data fetch to store in cache
// Working on this..........




// ************Get Requests
app.get('/', RedCache)

// **********Post Requests
app.post('/', BST_SAVE_DATA, (req, res) => {
  
  let side = req.body.side;
  let price = req.body.price;
  // save data to bst
  let bst_data = {side:side,price:price};
  bst.add(bst_data);
  // request params assigned to model keys
  const order = new orders({
    side: side,
    price: price
  });
  
  if (side === "sell"){
    // Matching, saving and deleting data in redis.
    orders.findOne({
      side: "buy",
      price: price
    }, (err, data) => {
      if (data === null) {
        // console.log("data does not exist in database");
        order.save().then((data) => {
          console.log(data);
        }).catch(err => {
          throw err
        });

      } else {
        orders.deleteMany({
          __v: 0
        }).then(function () {
          bst.remove(bst_data);
          console.log("Data deleted from mongodb and binary tree"); // Success
        }).catch(function (error) {
          console.log(error); // Failure
        });
      }
    });
} else if (side === "buy") {
  // matching, saving and deleting data on cloud.
  orders.findOne({
    side: "sell",
    price: price
  }, (err, data) => {
    if (data === null) {
      // console.log("data does not exist in database");
      order.save().then((data) => {
        console.log(data);
      }).catch(err => {
        throw err
      });
    } else {
      orders.deleteMany({
        __v: 0
      }).then(function () {
        bst.remove(bst_data);
        console.log("Data deleted from mongodb and binary tree"); // Success
      }).catch(function (error) {
        console.log(error); // Failure
      });
    }
  });
}
}
);



// Start Server at PORT 3000
let port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`The server is running on localhost:${port}`);
})

// Cloud Database Connect
const ConnectMongoose = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      keepAlive: true,
      
    })

    console.log(`\nConnected to Cloud Database `)
  } catch (error) {
    console.log(error)
  };
  mongoose.Promise = global.Promise;
}

ConnectMongoose();