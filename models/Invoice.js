const mongoose = require('mongoose');

const invoiceNumberSchema = new mongoose.Schema({
  currentNumber: {
    type: Number,
    required: true,
  },
  orderNumber:{
    type:String,
    required:true
  }
});

const InvoiceNumber = mongoose.model('InvoiceNumber', invoiceNumberSchema);

module.exports = InvoiceNumber;
