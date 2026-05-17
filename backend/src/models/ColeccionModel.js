const db = require('../config/db');

class ColeccionModel {

    static async getAll() {
        return db.query(`
            SELECT idCOLECCION, NombreColeccion, Temporada, Año
            FROM COLECCION
        `);
    }

    static async getById(id) {
        const rows = await db.query(
            `SELECT * FROM COLECCION WHERE idCOLECCION = ?`, [id]
        );
        return rows[0] || null;
    }

    static async crear(data) {
        const { NombreColeccion, Temporada, Año } = data;
        const result = await db.execute(
            `INSERT INTO COLECCION (NombreColeccion, Temporada, Año)
             VALUES (?, ?, ?)`,
            [NombreColeccion, Temporada, Año]
        );
        return result.insertId;
    }

    static async actualizar(id, data) {
        const { NombreColeccion, Temporada, Año } = data;
        return db.execute(
            `UPDATE COLECCION
             SET NombreColeccion = ?, Temporada = ?, Año = ?
             WHERE idCOLECCION = ?`,
            [NombreColeccion, Temporada, Año, id]
        );
    }

 static async eliminar(id) {
        return db.execute(
            `DELETE FROM COLECCION WHERE idCOLECCION = ?`, [id]
        );
    }

    static async getPrendasByColeccion(id) {
        const rows = await db.query(
            `SELECT 
                idPREND,
                Referencia,
                ttl_materiales,
                ttl_insumos_var,
                ttl_insumos_fijos,
                Costo_confeccion,
                Costo_total
             FROM prenda
             WHERE COLECCION_idCOLECCION = ?`,
            [id]
        );
        return rows;
    }
}

module.exports = ColeccionModel;
