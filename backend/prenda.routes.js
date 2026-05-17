const express  = require('express');
const router   = express.Router();
const Prenda   = require('../models/PrendaModel');
const InsFijo  = require('../models/InsumoFijoModel');
const { authMiddleware, rolesMiddleware } = require('../middlewares/auth.middleware');

// Guardar prenda completa (telas + insumos variables)
router.post('/guardar', authMiddleware, rolesMiddleware(1, 4), async (req, res) => {
  try {
    const result = await Prenda.guardarCompleto(req.body, req.usuario.id);
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Obtener prendas de una colección (filas planas, uso interno)
router.get('/coleccion/:colId', authMiddleware, async (req, res) => {
  try {
    const data = await Prenda.getByColeccion(req.params.colId);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ─── NUEVO ────────────────────────────────────────────────────────────────────
// Carga TODAS las referencias guardadas reconstruyendo los arrays
// TELAS e INSUMOS exactamente como los espera el frontend.
// Query opcional: ?colId=5  para filtrar solo una colección.
// Accesible a todos los roles autenticados (incluyendo Rol 2 Financiero).
router.get('/para-frontend', authMiddleware, async (req, res) => {
  try {
    const colId = req.query.colId ? parseInt(req.query.colId) : null;
    const data  = await Prenda.getCompletoParaFrontend(colId);
    res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// Guardar insumos fijos globales
router.post('/insumos-fijos', authMiddleware, rolesMiddleware(1, 4), async (req, res) => {
  try {
    await InsFijo.guardarTodos(req.body.fijos);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Cargar insumos fijos desde BD al iniciar
router.get('/insumos-fijos', authMiddleware, async (req, res) => {
  try {
    const data = await InsFijo.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
