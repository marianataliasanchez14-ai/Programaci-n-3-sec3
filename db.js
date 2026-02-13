const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== ""
    ? { connectionString: process.env.DATABASE_URL.trim() }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'mi_ecommerce',
        port: process.env.DB_PORT || 5432,
    };

if (process.env.DATABASE_URL) {
    console.log('Usando DATABASE_URL para la conexión.');
} else {
    console.log(`Usando variables individuales. Host: ${poolConfig.host}, DB: ${poolConfig.database}`);
}

poolConfig.ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;

const pool = new Pool(poolConfig);

// Verificación de conexión
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ ERROR de conexión a la DB:', err.message);
    } else {
        console.log('✅ Base de datos conectada exitosamente a las:', res.rows[0].now);
    }
});

module.exports = {
    query: (text, params, callback) => pool.query(text, params, callback),
    pool: pool
};