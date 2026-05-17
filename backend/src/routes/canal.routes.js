const express = require('express');
const router  = express.Router();
const Canal   = require('../models/CanalModel');
const { authMiddleware, rolesMiddleware } = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await Canal.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/guardar', authMiddleware, rolesMiddleware(2, 4), async (req, res) => {
  try {
    await Canal.guardarTodos(req.body.canales);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;