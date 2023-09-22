const User = require("../models/User");
const Product = require("../models/Product");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');


const createToken = (id) => {
  return jwt.sign({ id }, process.env.KEY, {
    expiresIn: '10d'
  });
};

const createRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.KEY, {
    expiresIn: '360d'
  });
};

module.exports.refresh_token_post = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token not found' });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.KEY);
    const accessToken = createToken(decoded.id);
    res.cookie('jwt', accessToken, { httpOnly: true, 
                                      maxAge: 5 * 24 * 60* 60 * 1000 , 
                                      secure: true,                          
                                      sameSite:'none'});

    res.status(200).json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};


module.exports.signup_post = async (req, res) => {
  const { data } = req.body;
  const email = data.email;
  const password = data.password;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const user = await User.create({ email, password });
    const accessToken = createToken(user._id);
    const refreshToken = createRefreshToken(user._id);
    res.cookie('jwt', accessToken, { httpOnly: true, 
                                     maxAge: 5 * 24 * 60 * 60 * 1000, 
                                     secure: true, 
                                     sameSite:'none' });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, 
                                               maxAge: 7 * 24 * 60 * 60 * 1000, 
                                               secure: true , 
                                               sameSite: 'none'});
    res.status(201).json({ user: user._id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred during sign-up. Please try again later.' });
  }
};


module.exports.login_post = async (req, res) => {
  const { data } = req.body;

  try {
    const user = await User.login(data.email, data.password);
    const accessToken = createToken(user._id);
    const refreshToken = createRefreshToken(user._id);
    res.cookie('jwt', accessToken, { httpOnly: true, 
                                     maxAge: 5 * 24 * 60 * 60 * 1000, 
                                     secure: true, 
                                     sameSite: 'none' });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, 
                                               maxAge: 7 * 24 * 60 * 60 * 1000, 
                                               secure: true, 
                                               sameSite: 'none' });

    res.status(200).json({ user: user._id , userData:user});
  } catch (err) {
    res.status(400).json({ error: 'wrong email or password' }); // Send specific error details
  }
};



module.exports.logout_get = (req, res) => {
  try {
    res.cookie('jwt', '', { maxAge: 1, 
                            httpOnly: true, 
                            secure: true, 
                            sameSite: 'none' });

    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred during logout.' });
  }
};



module.exports.fpassword_post = async (req, res) => {
  const { email } = req.body;

  try {
    const otp = req.session.otp.value;

    let transporter = nodemailer.createTransport({
      host: 'smtp.centrum.cz',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAILUSER, 
        pass: process.env.EMAILPASSWORD, 
      },
    });

    let mailOptions = {
      from: process.env.EMAILUSER, // sender address
      to: email, 
      subject: 'TEST ZAPOMENUTÉHO HESLA', 
      text: ` ${email}, NOVÝ KÓD ${otp}`, 
      html: `<b>${otp}</b>`, 
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        res.status(500).json({ error: 'Email sending failed' });
      } else {
        res.status(200).json({ message: 'OTP sent successfully!' });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }   
};



module.exports.verifyOTP_post = async (req, res) => {
    const { code } = req.body;
    const storedOTP = req.session.otp;

  try {

    res.status(200).json({ message: code, storedOTP });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  } 


/*   try {
    const { code } = req.body;
    const storedOTP = req.session.otp;

    if (storedOTP.value === code && Date.now() < storedOTP.expires) {
      req.session.isAuthenticated = true;
      res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
      res.status(401).json({ error: 'Invalid OTP or session expired.' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  } */


};





module.exports.resetPassword_post = async (req, res) => {
  const { password, email } = req.body;

try {
  if (password.length < 6) {
    throw Error('Password must be at least 6 characters');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw Error('User not found');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const updatedUser = await User.findByIdAndUpdate(user._id, { password: hashedPassword }, { new: true });

  res.status(200).json({ user: updatedUser._id });


} catch (err) {
  res.status(500).json({ error: 'Internal server error' });
} 
};


module.exports.changePassword_post = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  const token = req.cookies.jwt;
  

  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        try {
          const passwordMatch = await bcrypt.compare(oldPassword, user.password);
          if (!passwordMatch) {
            throw new Error('incorrect old password');
          }

          if (newPassword.length < 6) {
            throw new Error('incorrect new password');
          }

          const hashedPassword = await bcrypt.hash(newPassword, 10);

          await User.updateOne({ _id: user._id }, { password: hashedPassword });
          res.status(201).json({ user: 'password changed' });
          return; 
        } catch (err) {
          res.status(400).send(err.message);
          return; 
        }

      }
    });
  } else {
      next();
  } 
};




module.exports.getUser = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        try {
          res.status(201).json({ user: user });
        } catch (err) {
          res.status(400).send(err.message);
        }
      }
    });
  } else {
    res.status(401).send({ error: 'Unauthorized' });
    next();
  }
};





module.exports.updateUser_put = async (req, res, next) => {
  const data = req.body.data;
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        next(); 
      } else {
        try {
          const user = await User.findById(decodedToken.id);

          if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
          }

          await User.updateOne({ _id: user._id }, { $set: data });

          res.status(200).json({ message: 'Updated successfully' });
        } catch (err) {
          res.status(400).json({ error: err.message });
        }
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
    next(); 
  }
};



//admin


module.exports.getUsers = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.KEY, async (err) => {
      if (err) {
        next(); 
      } else {
        let users = await User.find({});
      try {
          res.status(201).json({ users: users });
        } catch (err) {
          res.status(400).send(err.message); 
        }
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
    next(); 
  }
};



module.exports.getProductsAdmin = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.KEY, async (err) => {
      if (err) {
        next(); 
      } else {
        let products = await Product.find({});
      try {
          res.status(201).json({ products: products });
        } catch (err) {
          res.status(400).send(err.message); 
        }
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
    next();
  }
};



module.exports.getUserADMIN = async (req, res, next) => {
  const token = req.cookies.jwt;
  const userID = req.query.id; 


  if (token) {
    jwt.verify(token, process.env.KEY, async (err) => {
      if (err) {
        next(); 
      } else {
          try {
          const user = await User.findById(new mongoose.Types.ObjectId(userID));
          res.locals.user = user;
          res.status(201).json({ user: user });
        } catch (err) {
          res.status(400).send(err.message); 
        }
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
    next(); 
  }
};

module.exports.updateUserADMIN_put = async (req, res, next) => {
  const data = req.body.data;
  const token = req.cookies.jwt;
  const userID = req.body.userID;

 {
  if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
        next(); 
      } else {
        try {
          const user = await User.findById(new mongoose.Types.ObjectId(userID));
  
          await User.updateOne(
            { _id: user._id },
            { $set:  data  }
          );
          res.status(200).json({ message: 'updated successfully' });
     
        } catch (err) {
          res.status(400).json({ error: err.message });
        }
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
    next(); 
  }
} 
};




module.exports.changepasswordADMIN = async (req, res, next) => {
  const newPassword  = req.body.newPassword;
  const userID = req.body.userID;
  const token = req.cookies.jwt;

   if (token) {
    jwt.verify(token, process.env.KEY, async (err, decodedToken) => {
      if (err) {
         next();
      } else {
            const user = await User.findById(new mongoose.Types.ObjectId(userID));
           try {
     
          if (newPassword.length < 6) {
            throw new Error('incorrect new password');
          }

          const hashedPassword = await bcrypt.hash(newPassword, 10);

          await User.updateOne({ _id: user._id}, { password: hashedPassword });
          
          res.status(200).json({ message: 'password updated successfully' });
          return; 
        } catch (err) {
          res.status(400).send(err.message); 
          return; 
        }

      }
    });
  } else {
   res.status(401).json({ error: 'Unauthorized' });
   next();
  }   
};



