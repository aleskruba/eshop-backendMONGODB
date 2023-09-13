const mongoose = require('mongoose');
const InvoiceNumber = require('./Invoice'); 

const orderSchema = new mongoose.Schema({

  mongoUserId: {  //  user id
    type: String,
  }, 
  shipment: {   // true or false
    type: Boolean,
    required: true,
  },
  date: {   // date
    type: Date,
    required: true,
  },
  shipmentCost: {  
    type: Number,
    required: true,
  },
  invoiceNumber: {
    type: Number,
    default: 0, // Provide a default value (e.g., 0) or an initial invoice number
    required: true,
  },
  basket: [{
    id: Number,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    // Add any other fields you need here
  }]


});



const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
