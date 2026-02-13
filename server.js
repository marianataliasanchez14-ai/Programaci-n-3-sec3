const express = require('express');

const path = require('path')

const session = require('express-session');

const db = require('./db'); // Importa la conexión a la base de datos

const authRoutes = require('./routes/auth'); // Importa las rutas de autenticación

const productsRoutes = require('./routes/products'); //Importa las rutas de productos

const cartRoutes = require('./routes/cart'); //Importa las rutas de carrito


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
app.use('/auth', authRoutes);
app.use('/productos', productsRoutes);
app.use('/cart', cartRoutes);



app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});