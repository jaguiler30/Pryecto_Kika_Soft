const db = require('../config/db');

class InsumoFijoModel {
  static async getAll() {
    return db.query(`SELECT * FROM insumos_fijo_glovales ORDER BY idINSUMOS_FIJO_GLOVALES`);
  }

  static async guardarTodos(fijos) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(`DELETE FROM insumos_fijo_glovales`);
      for (const f of fijos) {
        if (!f.name) continue;
        await conn.execute(
          `INSERT INTO insumos_fijo_glovales (Nombre, Cantidad, Precio_unitari, Costo_total)
           VALUES (?,?,?,?)`,
          [f.name, f.qty, f.precio, f.qty * f.precio]
        );
      }
      await conn.commit();
      return { ok: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = InsumoFijoModel;