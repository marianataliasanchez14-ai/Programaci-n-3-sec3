const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./db');

const cartRoutes = require('./routes/cart');

const app = express();

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'tu_secreto',
  resave: false,
  saveUninitialized: false,
}));

// Rutas
app.use('/cart', cartRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});