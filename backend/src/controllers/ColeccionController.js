const ColeccionService = require('../services/ColeccionService');

class ColeccionController {

    // GET /api/colecciones
    static async getAll(req, res) {
        try {
            const data = await ColeccionService.getAll();
            return res.status(200).json({ ok: true, data });
        } catch (err) {
            return res.status(500).json({ ok: false, message: err.message });
        }
    }

    // GET /api/colecciones/:id
    static async getById(req, res) {
        try {
            const data = await ColeccionService.getById(req.params.id);
            return res.status(200).json({ ok: true, data });
        } catch (err) {
            return res.status(404).json({ ok: false, message: err.message });
        }
    }

    // POST /api/colecciones
    static async crear(req, res) {
        try {
            const data = await ColeccionService.crear(req.body, req.usuario.id);
            return res.status(201).json({
                ok: true, data,
                message: 'Colección creada correctamente'
            });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

    // PUT /api/colecciones/:id
    static async actualizar(req, res) {
        try {
            const data = await ColeccionService.actualizar(
                req.params.id, req.body, req.usuario.id
            );
            return res.status(200).json({
                ok: true, data,
                message: 'Colección actualizada'
            });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

   // DELETE /api/colecciones/:id
    static async eliminar(req, res) {
        try {
            await ColeccionService.eliminar(req.params.id, req.usuario.id);
            return res.status(200).json({
                ok: true,
                message: 'Colección eliminada'
            });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

    // GET /api/colecciones/:id/prendas
    static async getPrendas(req, res) {
        try {
            const data = await ColeccionService.getPrendas(req.params.id);
            return res.status(200).json({ ok: true, data });
        } catch (err) {
            return res.status(404).json({ ok: false, message: err.message });
        }
    }
}

module.exports = ColeccionController;