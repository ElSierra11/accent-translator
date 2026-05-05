const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const db = require('../shared/database');
const { JWT_SECRET } = require('../shared/auth');

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_CLIENT_ID = '585325731605-5h19gko7sk42le3lc00brv3spr0uj2g4.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Función para obtener ubicación desde IP
async function getLocationFromIP(req) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip && ip.includes(',')) ip = ip.split(',')[0]; // En caso de múltiples IPs en el header
  
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
    return 'Desconocido (Local)';
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    if (data.status === 'success') {
      return `${data.country}, ${data.regionName}`;
    }
  } catch (error) {
    console.error("Error fetching IP API:", error);
  }
  return 'Desconocido';
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const location = await getLocationFromIP(req);
  
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || !user.password) return res.status(400).json({ error: "Usuario o contraseña incorrecta" });

    if (bcrypt.compareSync(password, user.password)) {
      // Actualizar ubicación en cada inicio de sesión exitoso
      db.run("UPDATE users SET location = ? WHERE id = ?", [location, user.id]);
      
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, token, role: user.role, username: user.username, location });
    } else {
      res.status(400).json({ error: "Contraseña incorrecta" });
    }
  });
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const location = await getLocationFromIP(req);

  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: "El usuario y contraseña (min 6 caracteres) son obligatorios" });
  }

  db.get("SELECT id FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (user) return res.status(400).json({ error: "El nombre de usuario ya está en uso" });

    const hash = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();
    
    db.run("INSERT INTO users (username, password, role, created_at, location) VALUES (?, ?, 'user', ?, ?)", 
    [username, hash, createdAt, location], function(err) {
      if (err) return res.status(500).json({ error: "Error al crear usuario" });
      const token = jwt.sign({ id: this.lastID, username: username, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, token, role: 'user', username, location });
    });
  });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  const location = await getLocationFromIP(req);
  
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, sub: google_id, name } = payload;
    
    db.get("SELECT * FROM users WHERE google_id = ? OR email = ?", [google_id, email], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (user) {
        db.run("UPDATE users SET google_id = ?, location = ? WHERE id = ?", [google_id, location, user.id]);
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ success: true, token, role: user.role, username: user.username, location });
      } else {
        const baseUsername = email.split('@')[0];
        const newUsername = `${baseUsername}_${Math.floor(Math.random()*10000)}`;
        const createdAt = new Date().toISOString();
        
        db.run("INSERT INTO users (username, email, google_id, role, created_at, location) VALUES (?, ?, ?, 'user', ?, ?)", 
        [newUsername, email, google_id, createdAt, location], function(err) {
          if (err) return res.status(500).json({ error: "Error al crear usuario de Google" });
          const token = jwt.sign({ id: this.lastID, username: newUsername, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
          res.json({ success: true, token, role: 'user', username: newUsername, location });
        });
      }
    });
  } catch (err) {
    console.error("Google Auth error:", err);
    res.status(401).json({ error: "Autenticación de Google fallida" });
  }
});

app.listen(4001, () => console.log('Auth Service corriendo en puerto 4001'));
