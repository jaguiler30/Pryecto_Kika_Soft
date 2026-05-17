const express            = require('express');
const router             = express.Router();
const SoporteController  = require('../controllers/SoporteController');
const { authMiddleware, rolesMiddleware } = require('../middlewares/auth.middleware');

// ============================================
// RUTAS: /api/soporte
// ============================================

// Admin — ver todos los tickets
router.get('/',
    authMiddleware,
    rolesMiddleware(4),
    SoporteController.getAll
);

// Cualquier usuario — ver sus propios tickets
router.get('/mis-solicitudes',
    authMiddleware,
    SoporteController.getMisSolicitudes
);

// Cualquier usuario — crear ticket (excepto admin rol 4)
router.post('/',
    authMiddleware,
    SoporteController.crear
);

// Admin — cambiar estado del ticket
router.put('/:id/estado',
    authMiddleware,
    rolesMiddleware(4),
    SoporteController.cambiarEstado
);

module.exports = router;
