const jwt = require('jsonwebtoken');
const User = require('../models/User');
const otpGenerator = require('otp-generator');

const Redis = require('ioredis'); // Import ioredis
const redis = new Redis('redis://red-ck6jeh88elhc73ea8m4g:6379');

const requireAuth = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.KEY, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        return res.status(401).json({ message: 'Unauthorized' });
      } else {
        // Token is valid, continue to the next middleware or route handler
        req.user = decodedToken; // Save the user data from the token in the request object
         next();
      }
    });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

const requireADMINAuth = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        return res.status(401).json({ message: 'Unauthorized' });
      } else {
        // Token is valid, continue to the next middleware or route handler
        req.user = decodedToken; // Save the user data from the token in the request object

        try {
          const user = await User.findOne({ _id: req.user.id });
          if (user && user.admin) {
            next(); // User is an admin, proceed to the next middleware or route
          } else {
            return res.status(403).json({ message: 'Forbidden' });
          }
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
      }
    });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};


// checkUser middleware
const checkUser = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
      try {
        const decodedToken = await jwt.verify(token, process.env.KEY);
        req.user = decodedToken; // Save the user data from the token in the request object
       
        const user = await User.findOne({ _id: req.user.id });
  
        if (user) {
              // The 'user' variable now contains the complete user data
          req.user = user; 
               } else {
          // Handle the scenario when the user is not found (optional)
          console.log('User not found in the database');
          // Optionally, you can set req.user to null or perform any other action here.
        }
  
        next();
      } catch (err) {
        // Handle any error that occurs during verification
        console.log('Error verifying token:', err);
        req.user = null;
        next();
      }
    } else {
      req.user = null;
      next();
    }
  };


  async function generateOTP(length) {
    try {
      const otp = await otpGenerator.generate(length, {
        upperCaseAlphabets: false,
        specialChars: false,
      });
      return otp;
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw error;
    }
  }
  


/*   async function verifyUserResetPassword(req, res, next) {
    try {
      const { email } = req.method === "GET" ? req.query : req.body;
  
      // Generate OTP and set it in req.app.locals
      const otp = await generateOTP(6);

      req.app.locals.OTP = otp;
      req.session.otp = { value: otp, expires: Date.now() + 600000 }; 
  
      // Check the user existence
      let exist = await User.findOne({ email });
      if (!exist) return res.status(404).send({ error: "Can't find User!" });
  
      // If the user exists and OTP is generated, proceed to the next middleware
      res.status(201).send({ status: "OK" });
      next();
    } catch (error) {
      return res.status(404).send({ error: "Authentication Error" });
    }
  }
 */
  
  async function verifyUserResetPassword(req, res, next) {
    try {
      const { email } = req.method === "GET" ? req.query : req.body;
  
      // Generate OTP
      const otp = await generateOTP(6);
  
      // Store OTP in Redis
      await req.redis.set(`otp:${email}`, otp, 'EX', 600); // Expires in 600 seconds (10 minutes)
  
      // Check the user existence
      let exist = await User.findOne({ email });
      if (!exist) return res.status(404).send({ error: "Can't find User!" });
  
      // If the user exists and OTP is generated, proceed to the next middleware
      req.app.locals.OTP = otp;
      res.status(201).send({ status: "OK" });
      next();
    } catch (error) {
      return res.status(404).send({ error: "Authentication Error" });
    }
  }

  module.exports = {checkUser,verifyUserResetPassword,generateOTP,requireAuth,requireADMINAuth};