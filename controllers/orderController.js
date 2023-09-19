const Order = require("../models/Order");
const User = require("../models/User");
const jwt = require('jsonwebtoken');

module.exports.getOrders = async (req, res) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.KEY, async (err,decodedToken) => {
      if (err) {
          res.status(401).json({ error: 'Unauthorized' });
      } else {
        try {
          const user = await User.findById(decodedToken.id);

          const orders = await Order.find({ mongoUserId: user._id });
          res.status(200).json({ orders }); // Send the products as a JSON response
        } catch (err) {
          res.status(500).json({ error: 'An error occurred while fetching products.' });
        }
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
