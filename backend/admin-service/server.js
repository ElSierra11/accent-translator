const express = require('express');
const cors = require('cors');
const db = require('../shared/database');
const { authenticateToken, requireAdmin } = require('../shared/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/config', authenticateToken, (req, res) => {
  db.all("SELECT * FROM config", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const config = {};
    rows.forEach(r => config[r.key] = r.value);
    
    if (config['enabled_accents']) {
      config.enabledIds = JSON.parse(config['enabled_accents']);
    } else {
      config.enabledIds = null;
    }

    if (config['elevenlabs_voice_mapping']) {
      config.voiceMapping = JSON.parse(config['elevenlabs_voice_mapping']);
    } else {
      config.voiceMapping = {};
    }

    if (req.user.role !== 'admin') {
      delete config['elevenlabs_api_key'];
    }

    res.json(config);
  });
});

app.post('/api/config', authenticateToken, requireAdmin, (req, res) => {
  const { enabledIds, elevenlabsApiKey, voiceMapping } = req.body;
  
  if (enabledIds) {
    db.run(`INSERT INTO config (key, value) VALUES ('enabled_accents', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [JSON.stringify(enabledIds)]);
  }
  
  if (elevenlabsApiKey !== undefined) {
    db.run(`INSERT INTO config (key, value) VALUES ('elevenlabs_api_key', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [elevenlabsApiKey]);
  }

  if (voiceMapping !== undefined) {
    db.run(`INSERT INTO config (key, value) VALUES ('elevenlabs_voice_mapping', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [JSON.stringify(voiceMapping)]);
  }
  
  res.json({ success: true });
});

app.get('/api/accents', (req, res) => {
  db.get("SELECT value FROM config WHERE key = 'enabled_accents'", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row && row.value) {
      res.json(JSON.parse(row.value));
    } else {
      res.json(null);
    }
  });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const query = `
    SELECT u.id, u.username, u.email, u.role, u.created_at, u.location, COUNT(c.id) as total_conversions
    FROM users u
    LEFT JOIN conversions c ON u.id = c.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/users/:id/conversions', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  db.all("SELECT * FROM conversions WHERE user_id = ? ORDER BY id DESC", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const stats = {};
  
  db.get("SELECT COUNT(*) as total FROM users", (err, row) => {
    stats.totalUsers = row ? row.total : 0;
    
    db.get("SELECT COUNT(*) as total FROM conversions", (err, row2) => {
      stats.totalConversions = row2 ? row2.total : 0;
      
      db.all("SELECT accent, COUNT(*) as count FROM conversions GROUP BY accent ORDER BY count DESC LIMIT 5", (err, rows) => {
        stats.topAccents = rows || [];
        res.json(stats);
      });
    });
  });
});

app.listen(4003, () => console.log('Admin Service corriendo en puerto 4003'));
