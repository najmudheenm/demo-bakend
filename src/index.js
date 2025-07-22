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

// Temporary permissive CORS for debugging
const corsOptions = {
  origin: function (origin, callback) {
    console.log('Incoming origin:', origin);
    // Allow all origins for now
    callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Enable CORS with the specified options
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

const data = [];

// Enhanced CORS and request logging
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const requestHeaders = req.headers['access-control-request-headers'];
  
  console.log('\n=== New Request ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Origin:', origin || 'none');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Set CORS headers
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', requestHeaders || 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight');
    return res.status(200).end();
  }
  
  next();
});

// Enhanced error handler for CORS and general errors
app.use((err, req, res, next) => {
  console.error('\n=== Error ===');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Headers:', req.headers);
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  if (err.message && err.message.includes('CORS')) {
    console.error('CORS Error Details:', {
      origin: req.headers.origin,
      method: req.method,
      url: req.url,
      headers: req.headers
    });
    
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    return res.status(200).json({
      success: false,
      error: 'CORS Error',
      message: err.message,
      details: {
        method: req.method,
        url: req.url,
        headers: req.headers
      }
    });
  }
  
  next(err);
});

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
    
    // Set response headers
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
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
