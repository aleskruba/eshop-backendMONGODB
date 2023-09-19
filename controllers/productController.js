const User = require("../models/User");
const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


module.exports.getProducts = async (req,res) => {
    try {
      const products = await Product.find(); 
      res.status(200).json({ products }); 
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'An error occurred while fetching products.' });
    }
  };

  
  module.exports.updateProducts = async (req, res) => {
    const updatedProducts = req.body.products;
    const token = req.cookies.jwt;
  
    if (token) {
      jwt.verify(token, process.env.KEY, async (err) => {
        if (err) {
          // Unauthorized: Invalid token or token expired
          res.status(401).json({ error: 'Unauthorized' });
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
       res.status(401).json({ error: 'Unauthorized' });
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
      
      next(); // Call the "next" function if there's no token
    }
  };
  
  
  
  
  //admin


module.exports.getProductsAdmin = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        next(); // Move to the next middleware in case of an error
      } else {
        let products = await Product.find({});
      try {
          res.status(201).json({ products: products });
        } catch (err) {
          res.status(400).send(err.message); // Send the error response with status 400
        }
      }
    });
  } else {
    res.status(401).json({ message:'you are not authorizied' });
    next(); 
  }
};


module.exports.getProductADMIN = async (req, res, next) => {
  const token = req.cookies.jwt;
  const productID = req.query.id; // Use req.query to access query parameters


  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        next(); // Move to the next middleware in case of an error
      } else {
           try {
          const product = await Product.findById(new mongoose.Types.ObjectId(productID));
           res.status(201).json({ product: product });
        } catch (err) {
          res.status(400).send(err.message); // Send the error response with status 400
        }
      }
    });
  } else {
    res.status(401).json({ message:'you are not authorizied' });
    next(); 
  }
};


module.exports.updateProductADMIN_put = async (req, res, next) => {
  const data = req.body.data;
  const token = req.cookies.jwt;
  const productID = req.body.productID;

 {
  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        next(); // Move to the next middleware in case of an error
      } else {
        try {
               const product = await Product.findById(new mongoose.Types.ObjectId(productID));
  
          await Product.updateOne(
            { _id: product._id },
            { $set:  data  }
          );
          res.status(200).json({ message: 'product updated successfully' });
     
        } catch (err) {
          res.status(400).json({ error: err.message });
        }
      }
    });
  } else {
    res.status(401).json({ message:'you are not authorizied' });
    next(); 
  }
} 
};

exports.savenewproductADMIN_post = async (req, res, next) => {
  const data = req.body.data;
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        next();
      } else {
        try {
          // Find the highest ID in the current products
          const highestIDProduct = await Product.findOne().sort({ id: -1 });

          // Calculate the new ID
          const newID = highestIDProduct ? highestIDProduct.id + 1 : 1;

          // Create a new product instance using the Mongoose model with the new ID
          const newProduct = new Product({ ...data, id: newID });

          // Save the new product to the database
          await newProduct.save();

          res.status(200).json({ message: 'Product saved successfully' });
        } catch (err) {
          res.status(400).json({ error: err.message });
        }
      }
    });
  } else {
    res.status(401).json({ message: 'You are not authorized' });
    next();
  }
};
