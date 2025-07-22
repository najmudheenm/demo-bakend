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

// Configure CORS for specific origin
const allowedOrigins = [
  'https://game.aviatrix.bet',
  'http://localhost:3000',      // For local testing
  'http://localhost:3443',      // For local HTTPS testing
  'https://134.209.146.172:3001', // Direct IP access
  'https://134.209.146.172'     // Without port for flexibility
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Incoming origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin header, allowing request');
      return callback(null, true);
    }
    
    // Check if the origin is in the allowed list or a subdomain
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      return origin === allowedOrigin || 
             origin.startsWith(allowedOrigin + '/') ||
             (origin.endsWith('.aviatrix.bet') && allowedOrigin.includes('aviatrix.bet'));
    });
    
    if (isAllowed) {
      console.log('Origin allowed:', origin);
      return callback(null, true);
    } else {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`;
      console.error('CORS Error:', msg);
      return callback(new Error(msg), false);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.some(o => origin && (origin === o || origin.startsWith(o + '/') || o.includes(origin.replace(/^https?:\/\//, ''))))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${origin || 'none'}`);
  next();
});

// Error handler for CORS
app.use((err, req, res, next) => {
  if (err.message.includes('CORS')) {
    console.error('CORS Error:', err.message);
    return res.status(403).json({
      success: false,
      error: 'Not allowed by CORS',
      message: err.message,
      allowedOrigins: allowedOrigins
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
