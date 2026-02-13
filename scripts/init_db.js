const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
    try {
        await client.connect();
        console.log('Conectado a la base de datos...');

        const p1 = path.join(__dirname, '..', 'schema.postgres.sql');
        const p2 = path.join(__dirname, '..', 'schema_sessions.sql');

        const sql1 = fs.readFileSync(p1, 'utf8');
        const sql2 = fs.readFileSync(p2, 'utf8');

        console.log('Ejecutando schema.postgres.sql...');
        await client.query(sql1);

        console.log('Ejecutando schema_sessions.sql...');
        await client.query(sql2);

        console.log('¡Tablas creadas exitosamente!');
    } catch (err) {
        console.error('Error inicializando DB:', err);
    } finally {
        await client.end();
    }
}

initDB();
