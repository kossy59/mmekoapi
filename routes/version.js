const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const VERSION_FILE = path.join(__dirname, '../version.json');

// GET - Check current version (Public)
router.get('/version', async (req, res) => {
    try {
        const data = await fs.readFile(VERSION_FILE, 'utf8');
        const versionData = JSON.parse(data);

        res.json({
            version: versionData.version,
            timestamp: versionData.timestamp || Date.now()
        });
    } catch (error) {
        console.error('Error reading version:', error);
        res.status(500).json({ error: 'Failed to read version' });
    }
});

// POST - Update version (Admin only)
router.post('/version', async (req, res) => {
    try {
        const { version } = req.body;

        if (!version) {
            return res.status(400).json({ error: 'Version is required' });
        }

        // Validate version format (x.y.z)
        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(version)) {
            return res.status(400).json({ error: 'Invalid version format. Use x.y.z format.' });
        }

        const versionData = {
            version,
            timestamp: Date.now()
        };

        await fs.writeFile(VERSION_FILE, JSON.stringify(versionData, null, 2));

        console.log(`✅ Version updated to ${version}`);

        res.json({
            success: true,
            version: versionData.version,
            timestamp: versionData.timestamp
        });
    } catch (error) {
        console.error('Error updating version:', error);
        res.status(500).json({ error: 'Failed to update version' });
    }
});

module.exports = router;
