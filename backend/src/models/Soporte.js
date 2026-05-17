const db = require('../config/db');

// ============================================
// MODEL: Soporte
// Representa la tabla SOPORTE de la BD
// ============================================
class Soporte {

    constructor(data = {}) {
        this.idSOPORTE        = data.idSOPORTE        || null;
        this.usuario_id       = data.usuario_id       || null;
        this.asunto           = data.asunto           || null;
        this.descripcion      = data.descripcion      || null;
        this.prioridad        = data.prioridad        || 'Media';
        this.estado           = data.estado           || 'Pendiente';
        this.fecha_creacion   = data.fecha_creacion   || null;
        this.fecha_resolucion = data.fecha_resolucion || null;
        // datos del JOIN con USUARIO
        this.NombreUsuario    = data.NombreUsuario    || null;
        this.EmailUsuario     = data.EmailUsuario     || null;
    }

    // ------------------------------------------
    // CREAR ticket
    // ------------------------------------------
    async save() {
        const sql = `
            INSERT INTO SOPORTE (usuario_id, asunto, descripcion, prioridad, estado)
            VALUES (?, ?, ?, ?, 'Pendiente')
        `;
        const result = await db.execute(sql, [
            this.usuario_id,
            this.asunto,
            this.descripcion,
            this.prioridad,
        ]);
        this.idSOPORTE = result.insertId;
        return this;
    }

    // ------------------------------------------
    // BUSCAR todos los tickets (con datos del usuario)
    // ------------------------------------------
    static async findAll() {
        const sql = `
            SELECT s.*,
                   u.Nombre AS NombreUsuario,
                   u.Email  AS EmailUsuario
            FROM SOPORTE s
            INNER JOIN USUARIO u ON s.usuario_id = u.idUSUARIO
            ORDER BY
                FIELD(s.prioridad, 'Alta', 'Media', 'Baja'),
                FIELD(s.estado, 'Pendiente', 'En proceso', 'Resuelto'),
                s.fecha_creacion ASC
        `;
        const rows = await db.query(sql);
        return rows.map(row => new Soporte(row));
    }

    // ------------------------------------------
    // BUSCAR por ID
    // ------------------------------------------
    static async findById(id) {
        const sql = `
            SELECT s.*,
                   u.Nombre AS NombreUsuario,
                   u.Email  AS EmailUsuario
            FROM SOPORTE s
            INNER JOIN USUARIO u ON s.usuario_id = u.idUSUARIO
            WHERE s.idSOPORTE = ?
        `;
        const rows = await db.query(sql, [id]);
        if (rows.length === 0) return null;
        return new Soporte(rows[0]);
    }

    // ------------------------------------------
    // BUSCAR tickets de un usuario específico
    // ------------------------------------------
    static async findByUsuario(usuario_id) {
        const sql = `
            SELECT * FROM SOPORTE
            WHERE usuario_id = ?
            ORDER BY fecha_creacion DESC
        `;
        const rows = await db.query(sql, [usuario_id]);
        return rows.map(row => new Soporte(row));
    }

    // ------------------------------------------
    // CAMBIAR ESTADO
    // ------------------------------------------
    static async cambiarEstado(id, estado) {
        const fechaResolucion = estado === 'Resuelto' ? new Date() : null;
        const sql = `
            UPDATE SOPORTE
            SET estado = ?,
                fecha_resolucion = ?
            WHERE idSOPORTE = ?
        `;
        await db.execute(sql, [estado, fechaResolucion, id]);
    }

    // ------------------------------------------
    // ELIMINAR ticket (al resolver)
    // ------------------------------------------
    static async delete(id) {
        const sql = `DELETE FROM SOPORTE WHERE idSOPORTE = ?`;
        await db.execute(sql, [id]);
    }

    toJSON() {
        return { ...this };
    }
}

module.exports = Soporte;
