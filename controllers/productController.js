const User = require("../models/User");
const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const Product = require("../models/Product");
const jwt = require('jsonwebtoken');


module.exports.getProducts = async (req, res,next) => {
    try {
      const products = await Product.find(); // Retrieve all products from the database
      res.status(200).json({ products }); // Send the products as a JSON response
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'An error occurred while fetching products.' });
    }
  };

  module.exports.updateProducts = async (req, res) => {
    const updatedProducts = req.body.products;
    const token = req.cookies.jwt;

    if (token) {
      jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
        if (err) {
          res.locals.user = null;
          next(); // Call the "next" function if an error occurs
        } else {

    try {
      await Promise.all(
        updatedProducts.map(async (updatedProduct) => {
          const productInBasket = req.body.basket.find(item => item.id === updatedProduct.id);
          if (productInBasket) {
            await Product.updateOne({ id: updatedProduct.id }, { $set: { amount: updatedProduct.amount } });
          }
        })
      );
  
      res.json({ message: 'Product amounts updated successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while updating products.' });
    }


  }
});
} else {
res.locals.user = null;
next(); // Call the "next" function if there's no token
}
  };

  // without Promise.all

/*   module.exports.updateProducts = async (req, res) => {
    const updatedProducts = req.body.products;
  
    try {
      for (const updatedProduct of updatedProducts) {
        const productInBasket = req.body.basket.find(item => item.id === updatedProduct.id);
        if (productInBasket) {
          await Product.updateOne({ id: updatedProduct.id }, { $set: { amount: updatedProduct.amount } });
        }
      }
  
      res.json({ message: 'Product amounts updated successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while updating products.' });
    }
  }; */

  
  
  
  module.exports.purchaseProducts = async (req, res) => {
    const token = req.cookies.jwt;
    const updatedProducts = req.body.products;
    const basket = req.body.basket;
    const shipment = req.body.shipment;
    const shipmentCost = req.body.shipmentCost;
  
    if (token) {
      jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
        if (err) {
          res.locals.user = null;
          next(); // Call the "next" function if an error occurs
        } else {
          let userID = await User.findById(decodedToken.id);
     
  
          try {
            // Validation of correct price
            const products = await Product.find();
            let totalSum = 0;
            for (const item of basket) {
              const product = products.find((p) => p.id === item.id);
              if (!product) {
                return res.status(400).json({ error: `Product with id ${item.id} not found.` });
              }
  
              if (item.quantity > product.amount) {
                return res.status(400).json({ error: `Not enough stock for product with id ${item.id}.` });
              }
  
              totalSum += item.quantity * product.price;
            }
  
            // Update product quantities
            await Promise.all(
              updatedProducts.map(async (updatedProduct) => {
                const productInBasket = basket.find(item => item.id === updatedProduct.id);
                if (productInBasket) {
                  await Product.updateOne({ id: updatedProduct.id }, { $set: { amount: updatedProduct.amount } });
                }
              })
            );
  
            const FreightCost = shipment ? shipmentCost : 0;
            const finalTotal = totalSum + FreightCost;
  
            // Find the latest invoice number record or create one with a currentNumber of 0
            let invoiceNumberRecord = await Invoice.findOne().sort({ currentNumber: -1 });
  
            let invoiceNumber = 2023000; // Default value if no records exist
  
            if (invoiceNumberRecord) {
              invoiceNumber = invoiceNumberRecord.currentNumber + 1;
            }
  
            // Create an order and associate it with the calculated invoice number
            const order = new Order({
              mongoUserId: userID._id.toString(),
              date: new Date(),
              shipment: shipment,
              shipmentCost: shipment ? shipmentCost : 0,
              basket: basket,
              invoiceNumber: invoiceNumber,
            });
  
            // Save the order to the database
            await order.save();
  
            // Create an invoice record
            const invoice = new Invoice({
              currentNumber: invoiceNumber,
              orderNumber: order._id.toString(),
            });
  
            // Save the invoice record to the database
            await invoice.save();
  
            res.status(200).json({ message: 'Order saved successfully', total: finalTotal });
          } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'An error occurred while processing the order.' });
          }
        }
      });
    } else {
      res.locals.user = null;
      next(); // Call the "next" function if there's no token
    }
  };
  
  
  
  
  