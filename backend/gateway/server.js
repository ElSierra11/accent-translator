const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

// Servir frontends
app.use(express.static(path.join(__dirname, '../../frontend-user', 'dist')));
app.use('/admin', express.static(path.join(__dirname, '../../frontend-admin', 'dist')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rutas a Auth Service (Puerto 4001)
app.use(createProxyMiddleware({
  target: 'http://localhost:4001',
  changeOrigin: true,
  pathFilter: ['/api/login', '/api/register', '/api/auth/google']
}));

// Rutas a Conversion Service (Puerto 4002)
app.use(createProxyMiddleware({
  target: 'http://localhost:4002',
  changeOrigin: true,
  pathFilter: ['/api/conversions']
}));

// Rutas a Admin Service (Puerto 4003)
app.use(createProxyMiddleware({
  target: 'http://localhost:4003',
  changeOrigin: true,
  pathFilter: (path, req) => {
    return path.startsWith('/api/admin') || path.startsWith('/api/config') || path.startsWith('/api/accents');
  }
}));

app.listen(4000, () => console.log('API Gateway corriendo en puerto 4000'));
