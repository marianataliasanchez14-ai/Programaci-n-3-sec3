const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// --- Registro de Usuario ---
router.post('/register', async (req, res) => {
    const { nombre, apellido, email, username, password } = req.body;

    // 1. Definir la contraseña maestra para ser admin
    const CLAVE_MAESTRA_ADMIN = 'patillaNa*2006';

    // 2. Determinar el rol según la contraseña ingresada
    let rolAsignado = 'cliente';
    if (password === CLAVE_MAESTRA_ADMIN) {
        rolAsignado = 'admin';
    }
    if (password.length < 8) {
        return res.status(400).send('La contraseña debe tener al menos 8 caracteres.');
    }
    // 4. Verificar si el usuario ya existe
    const checkSql = 'SELECT * FROM usuarios WHERE username = $1 OR email = $2';
    db.query(checkSql, [username, email], async (err, results) => {
        if (err) return res.status(500).send('Error en el servidor');
        if (results.rows.length > 0) {
            return res.status(400).send('El usuario o el correo ya están registrados.');
        }
        try {
            // 5. Encriptar la contraseña
            const hashedPw = await bcrypt.hash(password, 10);

            // 6. Insertar en la base de datos con el campo 'rol'
            const insertSql = 'INSERT INTO usuarios (nombre, apellido, email, username, password, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';

            db.query(insertSql, [nombre, apellido, email, username, hashedPw, rolAsignado], (err, insertResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error al guardar en la base de datos');
                }

                // 7. Respuesta exitosa enviando el ROL para la redirección
                res.status(200).json({
                    message: 'Registro exitoso',
                    nombre: nombre,
                    rol: rolAsignado,
                    id: insertResult.rows[0].id
                });
            });
        } catch (error) {
            res.status(500).send('Error al procesar el registro');
        }
    });
});

// --- Inicio de Sesión ---
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE username = $1';

    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).send('Error en el servidor');
        if (results.rows.length === 0) {
            return res.status(401).send('Usuario no encontrado');
        }
        const user = results.rows[0];
        try {
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).send('Contraseña incorrecta');
            }

            req.session.user = {
                id: user.id, // Para el carrito de compras
                nombre: user.nombre,
                rol: user.rol
            };
            // Si pasó el IF anterior, entonces sí está bien:
            res.status(200).json({
                message: 'Login exitoso',
                nombre: user.nombre,
                rol: user.rol
            });
        } catch (error) {
            res.status(500).send('Error al comparar');
        }

    });
});

// --- Logout ---
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Sesión cerrada');
});

module.exports = router;
