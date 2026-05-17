const UsuarioService = require('../services/UsuarioService');

// ============================================
// CONTROLLER: UsuarioController
// Recibe peticiones HTTP, llama al Service
// y devuelve la respuesta JSON al frontend
// NO contiene lógica de negocio
// ============================================
class UsuarioController {

    // POST /api/auth/login
    static async login(req, res) {
        try {
            const { Email, Password, ROL_idROL } = req.body;
            const resultado = await UsuarioService.login(Email, Password, ROL_idROL);
            return res.status(200).json({ ok: true, ...resultado });
        } catch (err) {
            return res.status(401).json({ ok: false, message: err.message });
        }
    }

    // GET /api/usuarios
    static async getAll(req, res) {
        try {
            const usuarios = await UsuarioService.getAll();
            return res.status(200).json({ ok: true, data: usuarios });
        } catch (err) {
            return res.status(500).json({ ok: false, message: err.message });
        }
    }

    // GET /api/usuarios/:id
    static async getById(req, res) {
        try {
            const usuario = await UsuarioService.getById(req.params.id);
            return res.status(200).json({ ok: true, data: usuario });
        } catch (err) {
            return res.status(404).json({ ok: false, message: err.message });
        }
    }

    // POST /api/usuarios
    static async crear(req, res) {
        try {
            const nuevo = await UsuarioService.crear(req.body, req.usuario.id);
            return res.status(201).json({ ok: true, data: nuevo, message: 'Usuario creado correctamente' });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

    // PUT /api/usuarios/:id
    static async modificar(req, res) {
        try {
            const actualizado = await UsuarioService.modificar(req.params.id, req.body, req.usuario.id);
            return res.status(200).json({ ok: true, data: actualizado, message: 'Usuario actualizado' });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

    // PUT /api/usuarios/:id/password
    static async cambiarPassword(req, res) {
        try {
            const { passwordActual, passwordNueva } = req.body;
            await UsuarioService.cambiarPassword(req.params.id, passwordActual, passwordNueva, req.usuario.id);
            return res.status(200).json({ ok: true, message: 'Contraseña actualizada correctamente' });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

    // PUT /api/usuarios/:id/bloquear
    static async bloquear(req, res) {
        try {
            await UsuarioService.bloquear(req.params.id, req.usuario.id);
            return res.status(200).json({ ok: true, message: 'Usuario bloqueado' });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

    // PUT /api/usuarios/:id/desbloquear
    static async desbloquear(req, res) {
        try {
            await UsuarioService.desbloquear(req.params.id, req.usuario.id);
            return res.status(200).json({ ok: true, message: 'Usuario desbloqueado' });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }

    // DELETE /api/usuarios/:id
    static async eliminar(req, res) {
        try {
            await UsuarioService.eliminar(req.params.id, req.usuario.id);
            return res.status(200).json({ ok: true, message: 'Usuario eliminado' });
        } catch (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
    }
}

module.exports = UsuarioController;
