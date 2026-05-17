const db = require('../config/db');

// ============================================
// MODEL: Historial
// Registra auditoría de cambios en la BD
// ============================================
class Historial {

    // Registra un cambio genérico en cualquier tabla auditada
    static async registrar({ tabla, registro_id, campo, valor_anterior, valor_nuevo, accion, usuario_id }) {
        const sql = `
            INSERT INTO HISTORIAL
                (Tabla_afectada, Registro_id, Campo, Valor_anterior, Valor_nuevo, Accion, Fecha, Usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
        `;
        await db.execute(sql, [
            tabla,
            registro_id,
            campo,
            valor_anterior !== null ? String(valor_anterior) : null,
            valor_nuevo    !== null ? String(valor_nuevo)    : null,
            accion,
            usuario_id,
        ]);
    }

    // Obtiene el historial de un registro específico
    static async findByRegistro(tabla, registro_id) {
        const sql = `
            SELECT h.*, u.Nombre AS NombreUsuario
            FROM HISTORIAL h
            LEFT JOIN USUARIO u ON h.Usuario_id = u.idUSUARIO
            WHERE h.Tabla_afectada = ? AND h.Registro_id = ?
            ORDER BY h.Fecha DESC
        `;
        return await db.query(sql, [tabla, registro_id]);
    }

    // Obtiene todo el historial paginado
    static async findAll({ pagina = 1, limite = 50 } = {}) {
        const offset = (pagina - 1) * limite;
        const sql = `
            SELECT h.*, u.Nombre AS NombreUsuario
            FROM HISTORIAL h
            LEFT JOIN USUARIO u ON h.Usuario_id = u.idUSUARIO
            ORDER BY h.Fecha DESC
            LIMIT ? OFFSET ?
        `;
        return await db.query(sql, [limite, offset]);
    }
}

module.exports = Historial;
