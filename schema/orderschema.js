const mongoose = require('mongoose');

const orderShema = new mongoose.Schema({
	side: {type:String,required:true},
    price:{type:String,required:true}
	
});
const order = mongoose.model('order', orderShema);	

module.exports=order;