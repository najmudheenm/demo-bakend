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



// Enable CORS with the specified options
// Enable CORS for all routes and origins
app.use(cors({
    origin: "*"
}));
app.use(express.json());


const data = [];

// Enhanced CORS and request logging



// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running with HTTPS' });
});

// Handle POST request from the client
app.post('/', (req, res) => {
  try {
    console.log('POST / - Request body:', req.body);
    
    const { last } = req.body;
    if (last === undefined) {
      throw new Error('Missing required field: last');
    }
    
    data.push(last);
    
    
    res.status(200).json({ 
      success: true,
      received: last,
      message: 'Data received successfully',
      protocol: 'https',
      timestamp: new Date().toISOString(),
      dataCount: data.length
    });
    
    console.log('POST / - Response sent successfully');
  } catch (error) {
    console.error('Error in POST /:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      headers: req.headers
    });
    
    const statusCode = error.message.includes('Missing') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
