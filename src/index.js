const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for specific origin
const corsOptions = {
  origin: 'https://game.aviatrix.bet',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Example API endpoint
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from secure backend!' });
});

// Read SSL certificate and key
const sslOptions = {
  key: fs.readFileSync('/app/ssl/private.key'),
  cert: fs.readFileSync('/app/ssl/certificate.crt')
};

// Create HTTPS server
const server = https.createServer(sslOptions, app);

server.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
