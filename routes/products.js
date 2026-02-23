const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const axios = require('axios');
const FormData = require('form-data');

// Configuración de multer para usar memoria (buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Función para subir imagen a ImgBB
async function subirAImgBB(file) {
    if (!file) return null;

    const API_KEY = process.env.IMGBB_API_KEY || '1ecb8761336a218f39b4caa439bdb740';
    const form = new FormData();
    form.append('image', file.buffer.toString('base64'));

    try {
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${API_KEY}`, form, {
            headers: form.getHeaders()
        });
        return response.data.data.url;
    } catch (error) {
        console.error('Error al subir a ImgBB:', error.response ? error.response.data : error.message);
        throw new Error('Error al subir la imagen a ImgBB');
    }
}

// Middleware para verificar si es admin
function esAdmin(req, res, next) {
    if (req.session.user && req.session.user.rol === 'admin') {
        return next();
    }
    res.status(403).send('Acceso denegado: Se requieren permisos de administrador');
}

// 3. RUTA PARA VER PRODUCTOS (GET)
router.get('/', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results.rows);
    });
});

// 4. RUTA POST
router.post('/', esAdmin, upload.single('imagen'), async (req, res) => {
    const { nombre, codigo, precio, descripcion, stock } = req.body;

    try {
        const imagenUrl = req.file ? await subirAImgBB(req.file) : null;

        // Primero verificamos si el código ya existe
        db.query('SELECT codigo FROM productos WHERE codigo = $1', [codigo], (err, results) => {
            if (err) return res.status(500).send('Error en la base de datos');

            if (results.rows.length > 0) {
                return res.status(400).send('El código ' + codigo + ' ya pertenece a otro producto.');
            }

            const sql = 'INSERT INTO productos (nombre, codigo, precio, descripcion, imagen, stock) VALUES ($1, $2, $3, $4, $5, $6)';
            db.query(sql, [nombre, codigo, precio, descripcion, imagenUrl, stock || 0], (err) => {
                if (err) return res.status(500).send('Error al insertar el producto');
                res.status(201).send('¡Producto guardado exitosamente!');
            });
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});
// RUTA PARA ACTUALIZAR PRODUCTO (PUT)
router.put('/:codigo', esAdmin, upload.single('imagen'), async (req, res) => {
    const { nombre, precio, descripcion, stock } = req.body;
    const codigo = req.params.codigo;

    try {
        let sql, params;

        if (req.file) {
            const imagenUrl = await subirAImgBB(req.file);
            sql = 'UPDATE productos SET nombre=$1, precio=$2, descripcion=$3, stock=$4, imagen=$5 WHERE codigo=$6';
            params = [nombre, precio, descripcion, stock, imagenUrl, codigo];
        } else {
            sql = 'UPDATE productos SET nombre=$1, precio=$2, descripcion=$3, stock=$4 WHERE codigo=$5';
            params = [nombre, precio, descripcion, stock, codigo];
        }

        db.query(sql, params, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al actualizar el producto');
            }
            res.send('Producto actualizado exitosamente');
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// RUTA PARA ELIMINAR PRODUCTO (DELETE)
router.delete('/:codigo', esAdmin, (req, res) => {
    const codigo = req.params.codigo;
    db.query('DELETE FROM productos WHERE codigo = $1', [codigo], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar el producto');
        }
        if (result.rowCount === 0) {
            return res.status(404).send('Producto no encontrado');
        }
        res.send('Producto eliminado exitosamente');
    });
});

module.exports = router;
