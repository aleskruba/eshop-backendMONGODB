// Require and configure dotenv before anything else
require('dotenv').config();
const User = require("./models/User");
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const axios = require('axios');


const corsOptions = {
  origin: 'http://localhost:5173', 
  credentials: true, 
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const USER = process.env.USER;
const PASSWORD = process.env.PASSWORD;


const dbURI  = `mongodb+srv://${USER}:${PASSWORD}@cluster0.ylxaimu.mongodb.net/?retryWrites=true&w=majority`

const SESSIONKEY = process.env.SESSIONKEY;

app.use(
  session({
    secret: SESSIONKEY, 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 } // 1 minute (in milliseconds)
  })
);

app.use('/api', authRoutes);


mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  // Start your Express server here
  app.listen(3500, () => {
    console.log('Server is running on port 3500');
  });
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
});








