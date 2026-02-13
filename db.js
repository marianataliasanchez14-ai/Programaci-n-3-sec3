const { Pool } = require('pg');

// Configuración de conexión usando variables de entorno
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'mi_ecommerce',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Verificación de conexión
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error adquiriendo cliente', err.stack);
    }
    console.log('Conectado a la base de datos PostgreSQL');
    release();
});

module.exports = {
    query: (text, params, callback) => pool.query(text, params, callback)
};