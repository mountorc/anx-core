const express = require('express');
const cors = require('cors');
const path = require('path');

// Import the anxToMarkdown function from the core module
const { anxToMarkdown } = require('../core/index.js');

const app = express();
const PORT = 7887;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint for converting ANX to Markdown
app.post('/convert', async (req, res) => {
  try {
    const { anxContent } = req.body;
    
    // Convert ANX to Markdown
    const markdown = await anxToMarkdown(anxContent);
    
    res.json({ markdown });
  } catch (error) {
    console.error('Error converting ANX to Markdown:', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
