const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Verificamos si hay URL de conexión
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl && !process.env.DB_HOST) {
    console.error('❌ ERROR: No se encontró DATABASE_URL ni variables de conexión individual.');
    console.error('Por favor, asegúrate de configurar DATABASE_URL en las Environment Variables de Render.');
    process.exit(1);
}

const clientConfig = dbUrl
    ? { connectionString: dbUrl }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
    };

// SSL necesario para Render
clientConfig.ssl = { rejectUnauthorized: false };

const client = new Client(clientConfig);

async function initDB() {
    try {
        console.log('Intenta conectar a la base de datos...');
        await client.connect();
        console.log('✅ Conexión exitosa.');

        const p1 = path.join(__dirname, '..', 'schema.postgres.sql');
        const p2 = path.join(__dirname, '..', 'schema_sessions.sql');

        if (!fs.existsSync(p1) || !fs.existsSync(p2)) {
            throw new Error('No se encontraron los archivos .sql en la raíz del proyecto.');
        }

        const sql1 = fs.readFileSync(p1, 'utf8');
        const sql2 = fs.readFileSync(p2, 'utf8');

        console.log('Creando tablas de aplicación...');
        await client.query(sql1);

        console.log('Creando tabla de sesiones...');
        await client.query(sql2);

        console.log('🚀 ¡Base de datos lista para usar!');
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Nota: Algunas tablas ya existen, no se realizaron cambios.');
        } else {
            console.error('❌ ERROR CRÍTICO durante la inicialización:');
            console.error(err.message);
            console.error('\nTips:');
            console.error('1. Verifica que DATABASE_URL sea la "Internal Database URL" de Render.');
            console.error('2. Asegúrate de que no haya espacios extra en el valor de la variable.');
        }
    } finally {
        await client.end();
    }
}

initDB();
