const jwt = require('jsonwebtoken');

const JWT_SECRET = 'accent-translator-super-secret-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ error: "No autorizado" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador." });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
