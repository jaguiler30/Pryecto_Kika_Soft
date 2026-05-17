const Soporte  = require('../models/Soporte');
const nodemailer = require('nodemailer');

// ============================================
// SERVICE: SoporteService
// ============================================
class SoporteService {

    // ------------------------------------------
    // CREAR ticket de soporte
    // ------------------------------------------
    static async crear(data, usuario_id) {
        if (!data.asunto || !data.descripcion)
            throw new Error('Asunto y descripción son requeridos');

        if (!data.prioridad || !['Alta','Media','Baja'].includes(data.prioridad))
            throw new Error('Prioridad inválida');

        const ticket = new Soporte({
            usuario_id,
            asunto:      data.asunto.trim(),
            descripcion: data.descripcion.trim(),
            prioridad:   data.prioridad,
        });
        await ticket.save();
        return ticket.toJSON();
    }

    // ------------------------------------------
    // OBTENER todos los tickets (para admin)
    // ------------------------------------------
    static async getAll() {
        return await Soporte.findAll();
    }

    // ------------------------------------------
    // OBTENER tickets del usuario actual
    // ------------------------------------------
    static async getMisSolicitudes(usuario_id) {
        return await Soporte.findByUsuario(usuario_id);
    }

    // ------------------------------------------
    // CAMBIAR ESTADO (para admin)
    // Al resolver → notifica por email y elimina el ticket
    // ------------------------------------------
    static async cambiarEstado(id, estado) {
        const estados = ['Pendiente', 'En proceso', 'Resuelto'];
        if (!estados.includes(estado))
            throw new Error('Estado inválido');

        const ticket = await Soporte.findById(id);
        if (!ticket) throw new Error('Ticket no encontrado');

        await Soporte.cambiarEstado(id, estado);

        // Si se resuelve → notificar por email y eliminar
        if (estado === 'Resuelto') {
            await SoporteService.notificarResolucion(ticket);
            await Soporte.delete(id);
        }

        return { ok: true, estado };
    }

    // ------------------------------------------
    // ENVIAR CORREO de notificación al resolver
    // ------------------------------------------
    static async notificarResolucion(ticket) {
        try {
            const transporter = nodemailer.createTransport({
                host:   process.env.MAIL_HOST   || 'smtp.gmail.com',
                port:   process.env.MAIL_PORT   || 587,
                secure: false,
                auth: {
                    user: process.env.MAIL_USER || '',
                    pass: process.env.MAIL_PASS || '',
                },
            });

            await transporter.sendMail({
                from:    `"Kika Vargas - Soporte" <${process.env.MAIL_USER}>`,
                to:      ticket.EmailUsuario,
                subject: `✅ Tu solicitud de soporte ha sido resuelta — ${ticket.asunto}`,
                html: `
                    <div style="font-family:sans-serif;max-width:480px;margin:auto">
                        <h2 style="color:#0e1b25">Tu solicitud fue resuelta</h2>
                        <p>Hola <strong>${ticket.NombreUsuario}</strong>,</p>
                        <p>Tu solicitud de soporte ha sido marcada como <strong>Resuelta</strong>.</p>
                        <table style="width:100%;border-collapse:collapse;margin:16px 0">
                            <tr>
                                <td style="padding:8px;background:#f4f5f7;font-weight:600">Asunto</td>
                                <td style="padding:8px;border-bottom:1px solid #e2e5ea">${ticket.asunto}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px;background:#f4f5f7;font-weight:600">Prioridad</td>
                                <td style="padding:8px;border-bottom:1px solid #e2e5ea">${ticket.prioridad}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px;background:#f4f5f7;font-weight:600">Fecha</td>
                                <td style="padding:8px">${new Date().toLocaleDateString('es-CO')}</td>
                            </tr>
                        </table>
                        <p style="color:#5a6472;font-size:13px">
                            Si el problema persiste, puedes abrir una nueva solicitud desde el sistema.
                        </p>
                        <p style="color:#5a6472;font-size:12px">— Equipo Kika Vargas</p>
                    </div>
                `,
            });
        } catch (err) {
            // El correo falla silenciosamente — no bloquea la resolución
            console.error('Error al enviar correo de soporte:', err.message);
        }
    }
}

module.exports = SoporteService;
