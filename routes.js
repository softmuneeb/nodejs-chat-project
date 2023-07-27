const express = require('express');
const bodyParser = require('body-parser');
const dbConnection = require('./mysql');
const redisClient = require('./redis');

const router = express.Router();
router.use(bodyParser.json());

// In-memory storage for user credentials (replace this with a proper authentication system in production)
const users = [
  {
    id: 1,
    username: 'muneeb',
    password: 'password123',
    email: 'muneeb@example.com',
  },
  { id: 2, username: 'john', password: 'john123', email: 'john@example.com' },
];

// In-memory storage for settings (replace this with a proper database in production)
let settings = {
  theme: 'light',
  notifications: true,
};

// Function to fetch messages from the database (using database query)
function fetchMessagesFromDatabase() {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM messages';
    dbConnection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching messages from the database:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// Middleware for authentication
function authenticateUser(req, res, next) {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.user = user;
  next();
}

// Middleware to check if the user is authenticated (for protected routes)
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Messages API with caching
router.get('/api/messages', cacheMessages);

// Middleware to cache messages in Redis for faster retrieval
function cacheMessages(req, res, next) {
  const cacheKey = 'messages';

  redisClient.get(cacheKey, (err, cachedData) => {
    if (err) {
      console.error('Error fetching data from Redis cache:', err);
      return next();
    }

    if (cachedData) {
      const messages = JSON.parse(cachedData);
      return res.json(messages);
    }

    // If data is not in cache, fetch it from the database
    fetchMessagesFromDatabase().then((messages) => {
      // Store data in Redis cache for future use (cache for 1 hour in this example)
      redisClient.setex(cacheKey, 3600, JSON.stringify(messages));
      res.json(messages);
    });
  });
}

// Billing API
router.get('/api/billing', (req, res) => {
  // Implement billing information retrieval logic here
  fetchBillingInfo()
    .then((billingInfo) => res.json(billingInfo))
    .catch((err) => {
      console.error('Error fetching billing information:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

// Payments API
router.post('/api/payments', (req, res) => {
  // Implement payment processing logic here
  const paymentData = req.body;
  // Process the payment and return the result
  res.json({ message: 'Payment processed successfully' });
});

// User Management APIs with soft-coded authentication
router.get('/api/users', requireAuth, (req, res) => {
  res.json(users);
});

router.post('/api/users', requireAuth, (req, res) => {
  const newUser = req.body;
  // Add the new user to the users array (replace this with proper user creation logic)
  users.push(newUser);
  res.json(newUser);
});

// Settings API with soft-coded settings
router.get('/api/settings', (req, res) => {
  res.json(settings);
});

router.post('/api/settings', (req, res) => {
  const updatedSettings = req.body;
  // Update the settings (replace this with proper settings update logic)
  settings = { ...settings, ...updatedSettings };
  res.json(settings);
});

module.exports = router;
