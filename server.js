const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Serve static files from the out directory
app.use(express.static(path.join(__dirname, 'out')));

// Handle all routes by serving the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'out', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://[YOUR_SERVER_IP]:${PORT}`);
});