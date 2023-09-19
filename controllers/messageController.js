const User = require("../models/User");
const Comment = require("../models/Comment");
const jwt = require('jsonwebtoken');



module.exports.sendMessage_post = async (req, res, next) => {
    const data = req.body.data;
    const stars = req.body.stars;
    const token = req.cookies.jwt;

     if (token) {
      jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
        if (err) {
          next();
        } else {
          try {
            const user = await User.findById(decodedToken.id);
  
              const newComment = new Comment({
              idUser: user._id,
              username: user.firstName,
              image: 'girl2.jpg' ,
              message: data.message,
              stars:stars
            });
  
             await newComment.save();
  
            res.status(200).json({ message: 'Message sent successfully' });
          } catch (err) {
            res.status(400).json({ error: err.message });
          }
        }
      });
    } else {
      res.status(401).send({ error: 'Unauthorized' });
      next(); 
    } 
  };


  module.exports.getMessages = async (req, res, next) => { 

    try {
      const comments = await Comment.find(); 
      res.status(200).json({ comments }); 
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'An error occurred while fetching products.' });
    }


  }