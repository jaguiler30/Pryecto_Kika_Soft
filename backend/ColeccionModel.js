const db = require('../config/db');

class ColeccionModel {

    static async getAll() {
        return db.query(`
            SELECT c.idCOLECCION, c.NombreColeccion, c.Temporada, c.Año,
                   COUNT(p.idPREND) AS totalReferencias
            FROM coleccion c
            LEFT JOIN prenda p ON p.COLECCION_idCOLECCION = c.idCOLECCION
            GROUP BY c.idCOLECCION, c.NombreColeccion, c.Temporada, c.Año
            ORDER BY c.Año DESC, c.NombreColeccion
        `);
    }

    static async getById(id) {
        const rows = await db.query(
            `SELECT * FROM coleccion WHERE idCOLECCION = ?`, [id]
        );
        return rows[0] || null;
    }

    static async crear(data) {
        const { NombreColeccion, Temporada, Año } = data;
        const result = await db.execute(
            `INSERT INTO coleccion (NombreColeccion, Temporada, Año)
             VALUES (?, ?, ?)`,
            [NombreColeccion, Temporada, Año]
        );
        return result.insertId;
    }

    static async actualizar(id, data) {
        const { NombreColeccion, Temporada, Año } = data;
        return db.execute(
            `UPDATE coleccion
             SET NombreColeccion = ?, Temporada = ?, Año = ?
             WHERE idCOLECCION = ?`,
            [NombreColeccion, Temporada, Año, id]
        );
    }

    static async eliminar(id) {
        return db.execute(
            `DELETE FROM coleccion WHERE idCOLECCION = ?`, [id]
        );
    }
}

module.exports = ColeccionModel;