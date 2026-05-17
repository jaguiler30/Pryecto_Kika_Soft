const express              = require('express');
const router               = express.Router();
const ColeccionController  = require('../controllers/ColeccionController');
const { authMiddleware, rolesMiddleware } = require('../middlewares/auth.middleware');

// Todos los roles autenticados pueden ver colecciones
router.get('/',    authMiddleware, ColeccionController.getAll);
router.get('/:id', authMiddleware, ColeccionController.getById);
router.get('/:id/prendas', authMiddleware, ColeccionController.getPrendas);

// Solo Admin (rol 4) y Materia Prima (rol 1) pueden crear/editar/eliminar
router.post('/',      authMiddleware, rolesMiddleware(1, 4), ColeccionController.crear);
router.put('/:id',    authMiddleware, rolesMiddleware(1, 4), ColeccionController.actualizar);
router.delete('/:id', authMiddleware, rolesMiddleware(1, 4), ColeccionController.eliminar);

module.exports = router;