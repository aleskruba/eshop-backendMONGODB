require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const Redis = require('ioredis'); // Add this line

const app = express();
const Product = require("./models/Product");
// Use CORS_ORIGIN from the production config
const corsOptions = {
  origin: ['https://eshop-clientstatic.onrender.com','http://localhost:5173'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const dbURI = process.env.MONGODB_URI;

const redisClient = new Redis(process.env.REDIS_URL); // Use the REDIS_URL environment variable

// Use express-session with connect-redis
app.use(
  session({
    store: new (require('connect-redis')(session))({
      client: redisClient,
    }),
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
    sameSite: 'none',
    secure: true,
  })
);

app.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.send({ products: products });
  } catch (error) {
    // Handle any errors here
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


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


