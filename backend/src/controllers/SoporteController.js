const SoporteService = require('../services/SoporteService');

// ============================================
// CONTROLLER: SoporteController
// ============================================
class SoporteController {

    // GET /api/soporte — admin ve todos los tickets
    static async getAll(req, res) {
        try {
            const tickets = await SoporteService.getAll();
            return res.status(200).json({ ok: true, data: tickets });
        } catch (err) {
            return res.status(500).json({ ok: false, message: err.message });
        }
    }

    // GET /api/soporte/mis-solicitudes — usuario ve sus propios tickets
    static async getMisSolicitudes(req, res) {
        try {
            const tickets = await SoporteService.getMisSolicitudes(req.usuario.id);
            return res.status(200).json({ ok: true, data: tickets });
        } catch (err) {
            return res.status(500).json({ ok: false, message: err.message });
        }
    }

    // POST /api/soporte — cualquier usuario crea un ticket
    static async crear(req, res) {
        try {
            const ticket = await SoporteService.crear(req.body, req.usuario.id);
            return res.status(201).json({
                ok: true,
                data: ticket,
                message: 'Solicitud de soporte enviada correctamente'
            });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

    // PUT /api/soporte/:id/estado — admin cambia el estado
    static async cambiarEstado(req, res) {
        try {
            const { estado } = req.body;
            const resultado = await SoporteService.cambiarEstado(req.params.id, estado);
            const msg = estado === 'Resuelto'
                ? 'Ticket resuelto — se notificó al usuario por correo'
                : `Estado actualizado a: ${estado}`;
            return res.status(200).json({ ok: true, ...resultado, message: msg });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }
}

module.exports = SoporteController;
