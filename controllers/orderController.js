const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const jwt = require('jsonwebtoken');


module.exports.getOrders = async (req, res,next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next(); // Move to the next middleware in case of an error
      } else {

    try {
      const orders = await Order.find(); // Retrieve all products from the database
      res.status(200).json({ orders }); // Send the products as a JSON response
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'An error occurred while fetching products.' });
    }

  }
})}
  };
