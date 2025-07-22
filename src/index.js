const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// SSL Certificate paths
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../ssl/private.key')),
  cert: fs.readFileSync(path.join(__dirname, '../ssl/certificate.crt'))
};

// Enable CORS for all origins (for development)
app.use(cors({
  origin: '*', // In production, replace with specific origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// Handle preflight requests
app.options('*', cors());

const data = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running with HTTPS' });
});

// Handle POST request from the client
app.post('/', (req, res) => {
  try {
    const { last } = req.body;
    data.push(last);
    res.status(200).json({ 
      success: true,
      received: last,
      message: 'Data received successfully',
      protocol: 'https'
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all received data
app.get('/', (req, res) => {
  try {
    res.status(200).json({ 
      success: true,
      data: data,
      message: 'Data retrieved successfully',
      protocol: 'https',
      count: data.length
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create HTTPS server
const server = https.createServer(sslOptions, app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on https://localhost:${PORT}`);
  console.log('Note: Using self-signed certificate. You may need to accept the security warning in your browser.');
});
