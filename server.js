const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Start the server
app.listen(port, () => {
    console.log(`Test server running at http://localhost:${port}`);
    console.log('Open test.html in your browser to run the tests');
}); 