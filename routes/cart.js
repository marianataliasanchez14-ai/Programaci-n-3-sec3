const express = require('express');
const router = express.Router();
const db = require('../db');

function estaLogueado(req, res, next) {
    if (req.session.user) return next();
    res.status(401).send('Debes iniciar sesión para usar el carrito');
}

// 1. AGREGAR AL CARRITO
router.post('/add', estaLogueado, (req, res) => {
    const { producto_id, cantidad } = req.body;
    const usuario_id = req.session.user.id;

    const sql = 'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES ($1, $2, $3)';
    db.query(sql, [usuario_id, producto_id, cantidad || 1], (err) => {
        if (err) return res.status(500).send('Error al agregar al carrito');
        res.send('Producto añadido al carrito');
    });
});

// 2. VER CARRITO
router.get('/', estaLogueado, (req, res) => {
    const usuario_id = req.session.user.id;
    // Seleccionamos p.id como producto_id para que el checkout funcione bien
    const sql = `
        SELECT c.id, p.id AS producto_id, p.nombre, p.precio, c.cantidad, (p.precio * c.cantidad) AS subtotal 
        FROM carrito c 
        JOIN productos p ON c.producto_id = p.id 
        WHERE c.usuario_id = $1`;

    db.query(sql, [usuario_id], (err, results) => {
        if (err) return res.status(500).send('Error al obtener el carrito');
        const total = results.rows.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);
        res.json({ items: results.rows, total_pagar: total.toFixed(2) });
    });
});

// 3. FINALIZAR COMPRA (Descuenta Stock y Vacía Carrito)
router.post('/checkout', estaLogueado, (req, res) => {
    const usuario_id = req.session.user.id;

    // A. Obtenemos lo que el usuario compró
    const sqlObtenerItems = 'SELECT producto_id, cantidad FROM carrito WHERE usuario_id = $1';

    db.query(sqlObtenerItems, [usuario_id], async (err, resultItems) => {
        if (err) return res.status(500).send('Error al procesar la compra');
        const items = resultItems.rows;

        if (items.length === 0) return res.status(400).send('Carrito vacío');

        try {
            // B. Restamos el stock para cada producto
            for (const item of items) {
                const sqlUpdateStock = 'UPDATE productos SET stock = stock - $1 WHERE id = $2 AND stock >= $3';

                await new Promise((resolve, reject) => {
                    db.query(sqlUpdateStock, [item.cantidad, item.producto_id, item.cantidad], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            }

            // C. Una vez descontado todo, borramos el carrito
            db.query('DELETE FROM carrito WHERE usuario_id = $1', [usuario_id], (err) => {
                if (err) return res.status(500).send('Error al limpiar el carrito');
                res.send('¡Compra realizada con éxito! El inventario ha sido actualizado 🍉');
            });

        } catch (error) {
            console.error("Error actualizando stock:", error);
            res.status(500).send('Hubo un error al actualizar el stock');
        }
    });
});

// 4. ELIMINAR ITEM
router.delete('/:id', estaLogueado, (req, res) => {
    const sql = 'DELETE FROM carrito WHERE id = $1 AND usuario_id = $2';
    db.query(sql, [req.params.id, req.session.user.id], (err) => {
        if (err) return res.status(500).send('Error al eliminar');
        res.send('Producto eliminado correctamente 🍉');
    });
});

module.exports = router;