const orders = require('./../schema/orderschema');
const client = require('redis').createClient();

let BST_SAVE_DATA = async (req, res, next) => {
    const side = req.body.side;
    const price = req.body.price;
    try {
        if (side === "sell") {
            await client.lpush("sell", price);
            // Matching, saving and deleting data in redis.
            await client.lrange('buy', 0, -1, (err, reply) => {
                if (err) {
                    console.log(err);
                } else {
                    reply.forEach(element => {
                        if (price === element) {
                            console.log('req price matched with Redis db price');
                            client.flushall();
                        } else {
                            console.log("could not find the price in redisDB");
                        }
                    });
                    res.redirect('/');
                    next();
                }
            });

        } else if (side === "buy") {
            await client.lpush("buy", price);
            // saving incoming buy data to redis Database.
            await client.lrange('sell', 0, -1, (err, reply) => {
                if (err) {
                    console.log(err);
                } else {
                    reply.forEach(element => {
                        if (price === element) {
                            client.flushall();
                        } else {
                            console.log("could not find the price in db");
                        }
                    });
                    res.redirect('/');
                    next();
                }
            }); //Redis Ends Here.
        }
    } catch (error) {
        throw error
    }
}

module.exports = BST_SAVE_DATA;