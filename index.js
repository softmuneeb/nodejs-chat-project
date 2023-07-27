const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const routes = require('./routes');

// Parse incoming request bodies
app.use(express.json());

// Include the routes
app.use('/', routes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
