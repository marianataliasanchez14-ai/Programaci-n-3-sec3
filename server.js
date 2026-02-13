const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./db');

// Importar rutas
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');

const app = express();

// Archivos estáticos
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Puerto dinámico para Render o 5000 local
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Config sesión (usar variable para SECRET en producción es buena práctica)
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true solo si hay HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));

// Si estamos en producción y usamos proxy (como Render), necesitamos esto para cookies seguras
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Rutas
app.use('/auth', authRoutes);
app.use('/productos', productsRoutes); // Usar /productos consistentemente
app.use('/cart', cartRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});