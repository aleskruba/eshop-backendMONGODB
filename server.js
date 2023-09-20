require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();

// Use CORS_ORIGIN from the production config
const corsOptions = {
 // origin: 'https://eshop-client-s05b.onrender.com',
 origin:'http://localhost:5173/', 
 credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const dbURI = process.env.MONGODB_URI;

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 } // 1 minute (in milliseconds)
  })
);

app.get('/', (req,res)=>{res.send('connected')});

app.use('/api', authRoutes);

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    // Use the PORT from the environment variable
    const port = process.env.PORT || 3500;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });


