const db = require('../config/db');

class CanalModel {
  static async getAll() {
    return db.query(`SELECT * FROM canal_venta ORDER BY idCanal`);
  }

  static async guardarTodos(canales) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const c of canales) {
        const [ex] = await conn.execute(
          `SELECT idCanal FROM canal_venta WHERE Nombre=?`, [c.name]
        );

        // Upsert precio_canal
        const [pcRes] = await conn.execute(
          `INSERT INTO precio_canal
           (Kv_markup, Ajuste_USD, Margen_extra, Sub_total1, Sub_total2, Precio_venta_cop, Precio_venta_USD)
           VALUES (?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
           Kv_markup=VALUES(Kv_markup), Ajuste_USD=VALUES(Ajuste_USD)`,
          [c.params.rtMkup, 0, 0, 0, 0, '0', '0']
        );
        const precioId = pcRes.insertId || pcRes[0]?.idPrecio_Canal;

        if (ex.length) {
          await conn.execute(
            `UPDATE canal_venta SET Nombre=?, Codigo=?, Precio_Canal_idPrecio_Canal=?
             WHERE idCanal=?`,
            [c.name, c.name.substring(0, 10), precioId, ex[0].idCanal]
          );
        } else {
          await conn.execute(
            `INSERT INTO canal_venta (Nombre, Codigo, Precio_Canal_idPrecio_Canal)
             VALUES (?,?,?)`,
            [c.name, c.name.substring(0, 10), precioId]
          );
        }
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

module.exports = CanalModel;