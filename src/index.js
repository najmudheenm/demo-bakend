const express = require('express');
const http = require('http'); // Changed from https to http for simplicity
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001; // Changed port to 3001 to match your request

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
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Handle POST request from the client
app.post('/', (req, res) => {
  try {
    const { last } = req.body;
    data.push(last);
    // Process the data as needed
    // For now, just echo it back
    res.status(200).json({ 
      success: true,
      received: last,
      message: 'Data received successfully'
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
app.get('/', (req, res) => {
  try {
    res.status(200).json({ 
      success: true,
      data: data,
      message: 'Data received successfully'
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create HTTP server (changed from HTTPS for simplicity)
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
