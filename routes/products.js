const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// 1. Configuración de Multer (Almacenamiento)
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        // Esto genera un nombre único usando la fecha actual + la extensión original
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

// 2. Middleware para proteger (Solo Admin)
function esAdmin(req, res, next) {
    if (req.session.user && req.session.user.rol === 'admin') {
        return next();
    }
    res.status(403).send('Acceso denegado');
}

// 3. RUTA PARA VER PRODUCTOS (GET)
router.get('/', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 4. RUTA POST
router.post('/', esAdmin, upload.single('imagen'), (req, res) => {
    const { nombre, codigo, precio, descripcion, stock } = req.body;
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Primero verificamos si el código ya existe
    db.query('SELECT codigo FROM productos WHERE codigo = ?', [codigo], (err, results) => {
        if (err) return res.status(500).send('Error en la base de datos');
        
        if (results.length > 0) {
            // Si el código ya existe, enviamos un error 400
            return res.status(400).send('El código ' + codigo + ' ya pertenece a otro producto.');
        }

        // Si no existe, procedemos a insertar
        const sql = 'INSERT INTO productos (nombre, codigo, precio, descripcion, imagen, stock) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [nombre, codigo, precio, descripcion, imagenUrl, stock || 0], (err) => {
            if (err) return res.status(500).send('Error al insertar el producto');
            res.status(201).send('¡Producto guardado exitosamente!');
        });
    });
});
// RUTA PARA ACTUALIZAR PRODUCTO (PUT)
router.put('/:codigo', esAdmin, upload.single('imagen'), (req, res) => {
    const { nombre, precio, descripcion, stock } = req.body;
    const codigo = req.params.codigo;
    
    let sql, params;

    // Si el usuario subió una imagen nueva
    if (req.file) {
        const imagenUrl = `/uploads/${req.file.filename}`;
        sql = 'UPDATE productos SET nombre=?, precio=?, descripcion=?, stock=?, imagen=? WHERE codigo=?';
        params = [nombre, precio, descripcion, stock, imagenUrl, codigo];
    } else {
        // Si no subió imagen, actualizamos todo menos la foto
        sql = 'UPDATE productos SET nombre=?, precio=?, descripcion=?, stock=? WHERE codigo=?';
        params = [nombre, precio, descripcion, stock, codigo];
    }

    db.query(sql, params, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar el producto');
        }
        res.send('Producto actualizado exitosamente');
    });
});

// RUTA PARA ELIMINAR PRODUCTO (DELETE)
router.delete('/:codigo', esAdmin, (req, res) => {
    const codigo = req.params.codigo;
    db.query('DELETE FROM productos WHERE codigo = ?', [codigo], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar el producto');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Producto no encontrado');
        }
        res.send('Producto eliminado exitosamente');
    });
});

module.exports = router;