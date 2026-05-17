const PrendaService = require('../services/PrendaService');

class PrendaController {

    // POST /api/prendas/guardar
    static async guardar(req, res) {
        try {
            const data = await PrendaService.guardar(req.body);
            return res.status(201).json({
                ok: true, data,
                message: 'Prenda guardada correctamente'
            });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

    // GET /api/prendas/coleccion/:colId
    static async getByColeccion(req, res) {
        try {
            const data = await PrendaService.getByColeccion(req.params.colId);
            return res.status(200).json({ ok: true, data });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }
}

module.exports = PrendaController;