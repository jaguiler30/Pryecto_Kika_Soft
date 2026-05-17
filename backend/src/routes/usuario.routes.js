const express            = require('express');
const router             = express.Router();
const UsuarioController = require('../controllers/UsuarioController');
const { authMiddleware, rolesMiddleware } = require('../middlewares/auth.middleware');

// ============================================
// RUTAS: /api/auth
// ============================================

// Login — pública (no requiere token)
router.post('/login', UsuarioController.login);
// ============================================
// RUTAS: /api/usuarios
// Todas protegidas — requieren token válido
// Crear/modificar/eliminar — solo Admin (rol 4)
// ============================================

router.get   ('/',              authMiddleware, rolesMiddleware(4),  UsuarioController.getAll);
router.get   ('/:id',          authMiddleware, rolesMiddleware(4),  UsuarioController.getById);
router.post  ('/',              authMiddleware, rolesMiddleware(4),  UsuarioController.crear);
router.put   ('/:id',          authMiddleware, rolesMiddleware(4),  UsuarioController.modificar);
router.put   ('/:id/password', authMiddleware,                      UsuarioController.cambiarPassword);
router.put   ('/:id/bloquear', authMiddleware, rolesMiddleware(4),  UsuarioController.bloquear);
router.put   ('/:id/desbloquear', authMiddleware, rolesMiddleware(4), UsuarioController.desbloquear);
router.delete('/:id',          authMiddleware, rolesMiddleware(4),  UsuarioController.eliminar);

module.exports = router;
