const mysql = require('mysql2');

// Configuración de conexión usando variables de entorno
// Render no ofrece MySQL gratis, pero esto permite conectar a una externa (Railway, Clever Cloud, etc)
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mi_ecommerce',
    port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
    if (err) {
        console.error("Error conectando a la base de datos:", err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Mantener la conexión viva (ping cada hora) para evitar timeout de servidores gratuitos
setInterval(() => {
    connection.query('SELECT 1', (err) => {
        if (err) console.error('Error en ping DB:', err);
    });
}, 3600000);

module.exports = connection;