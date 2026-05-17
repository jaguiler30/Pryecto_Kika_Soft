const db = require('../config/db');

class PrendaModel {

  static async guardarCompleto(data, usuarioId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Upsert prenda
      const [existing] = await conn.execute(
        `SELECT idPREND FROM prenda
         WHERE Referencia = ? AND COLECCION_idCOLECCION = ?`,
        [data.ref, data.colId]
      );

      let prendaId;
      if (existing.length) {
        prendaId = existing[0].idPREND;
        await conn.execute(
          `UPDATE prenda SET ttl_materiales=?, ttl_insumos_var=?, ttl_insumos_fijos=?,
           Costo_confeccion=?, Costo_total=? WHERE idPREND=?`,
          [data.ttlMat, data.ttlInsVar, data.ttlInsFijos,
           data.taller, data.costoTotal, prendaId]
        );
      } else {
        const [res] = await conn.execute(
          `INSERT INTO prenda (Referencia, ttl_materiales, ttl_insumos_var,
           ttl_insumos_fijos, Costo_confeccion, Costo_total, COLECCION_idCOLECCION)
           VALUES (?,?,?,?,?,?,?)`,
          [data.ref, data.ttlMat, data.ttlInsVar, data.ttlInsFijos,
           data.taller, data.costoTotal, data.colId]
        );
        prendaId = res.insertId;
      }

      // 2. Borrar prenda_tela anteriores (los materiales se borran en cascada
      //    o los desvinculamos primero para no dejar huérfanos)
      const [telasViejas] = await conn.execute(
        `SELECT idPREND_TELA FROM prenda_tela WHERE PRENDA_idPREND=?`, [prendaId]
      );
      if (telasViejas.length) {
        const viejoIds = telasViejas.map(t => t.idPREND_TELA);
        // Desvincular materiales que apuntaban a estas prenda_tela
        await conn.execute(
          `UPDATE material SET PRENDA_TELA_idPREND_TELA = NULL
           WHERE PRENDA_TELA_idPREND_TELA IN (${viejoIds.map(()=>'?').join(',')})`,
          viejoIds
        );
      }
      await conn.execute(`DELETE FROM prenda_tela WHERE PRENDA_idPREND=?`, [prendaId]);

      // 3. Insertar nuevos materiales
      for (let i = 0; i < data.materiales.length; i++) {
        const m = data.materiales[i];
        if (!m.Nombre) continue;

        // Insertar fila en prenda_tela primero
        const [ptRes] = await conn.execute(
          `INSERT INTO prenda_tela (Metros, Precio_Unitario, Costo_Total, Orden, PRENDA_idPREND)
           VALUES (?,?,?,?,?)`,
          [m.Mts, m.Precio, m.Mts * m.Precio, i + 1, prendaId]
        );
        const prendaTelaId = ptRes.insertId;

        // Insertar material apuntando a esa prenda_tela
        await conn.execute(
          `INSERT INTO material (Nombre, Tipo, Unidad_de_medida, Precio, PRENDA_TELA_idPREND_TELA)
           VALUES (?,?,?,?,?)`,
          [m.Nombre, 'Tela', m.Mts, m.Precio, prendaTelaId]
        );
      }

      // 4. Borrar insumos variables anteriores y reinsertar
      await conn.execute(`DELETE FROM prenda_insumos_var WHERE PRENDA_idPREND=?`, [prendaId]);
      for (let i = 0; i < data.insumos.length; i++) {
        const ins = data.insumos[i];
        if (!ins.name) continue;
        await conn.execute(
          `INSERT INTO prenda_insumos_var
           (Cantidad, Precio_unitario, Costo_Total, Orden, PRENDA_INSUMOS_VARcol, PRENDA_idPREND)
           VALUES (?,?,?,?,?,?)`,
          [ins.cant, ins.precio, ins.cant * ins.precio, i + 1, ins.name, prendaId]
        );
      }

      await conn.commit();
      return { ok: true, prendaId };

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getByColeccion(colId) {
    return db.query(
      `SELECT p.*, pt.Metros, pt.Precio_Unitario, pt.Orden,
              m.Nombre AS NombreMaterial, m.Tipo
       FROM prenda p
       INNER JOIN coleccion c ON c.idCOLECCION = p.COLECCION_idCOLECCION
       LEFT JOIN prenda_tela pt ON pt.PRENDA_idPREND = p.idPREND
       LEFT JOIN material m ON m.PRENDA_TELA_idPREND_TELA = pt.idPREND_TELA
       WHERE c.idCOLECCION = ?
       ORDER BY p.Referencia, pt.Orden`,
      [colId]
    );
  }

  /**
   * Devuelve todas las prendas guardadas con sus materiales e insumos variables,
   * agrupadas en el formato exacto que usa el frontend (arrays TELAS e INSUMOS).
   * Acepta opcionalmente un colId para filtrar por colección.
   */
  static async getCompletoParaFrontend(colId = null) {
    // ── 1. Traer prendas con su colección ──────────────────────────────
    const whereCol = colId ? 'WHERE c.idCOLECCION = ?' : '';
    const params   = colId ? [colId] : [];

    const prendas = await db.query(
      `SELECT p.idPREND, p.Referencia, p.Costo_confeccion,
              p.ttl_materiales, p.ttl_insumos_var, p.ttl_insumos_fijos, p.Costo_total,
              c.idCOLECCION, c.NombreColeccion
       FROM prenda p
       INNER JOIN coleccion c ON c.idCOLECCION = p.COLECCION_idCOLECCION
       ${whereCol}
       ORDER BY c.NombreColeccion, p.Referencia`,
      params
    );

    if (!prendas.length) return { telas: [], insumos: [] };

    const prendaIds = prendas.map(p => p.idPREND);
    const placeholders = prendaIds.map(() => '?').join(',');

    // ── 2. Traer materiales (telas) agrupados por prenda ───────────────
    const materiales = await db.query(
      `SELECT pt.PRENDA_idPREND, pt.idPREND_TELA, pt.Metros, pt.Precio_Unitario, pt.Orden,
              m.Nombre AS NombreMaterial, m.Tipo AS TipoMaterial
       FROM prenda_tela pt
       LEFT JOIN material m ON m.PRENDA_TELA_idPREND_TELA = pt.idPREND_TELA
       WHERE pt.PRENDA_idPREND IN (${placeholders})
       ORDER BY pt.PRENDA_idPREND, pt.Orden`,
      [...prendaIds]
    );

    // ── 3. Traer insumos variables agrupados por prenda ─────────────────
    const insumosVar = await db.query(
      `SELECT PRENDA_idPREND, PRENDA_INSUMOS_VARcol AS Nombre,
              Cantidad, Precio_unitario, Orden
       FROM prenda_insumos_var
       WHERE PRENDA_idPREND IN (${placeholders})
       ORDER BY PRENDA_idPREND, Orden`,
      [...prendaIds]
    );

    // ── 4. Agrupar en el formato {id, ref, col, taller, m:[]} ──────────
    const matMap = {};
    for (const m of materiales) {
      if (!matMap[m.PRENDA_idPREND]) matMap[m.PRENDA_idPREND] = [];
      matMap[m.PRENDA_idPREND].push({
        mat:   m.NombreMaterial || '',
        prov:  '',                        // proveedor no está en BD aún
        mts:   m.Metros        || 0,
        precio: m.Precio_Unitario || 0
      });
    }

    const insMap = {};
    for (const i of insumosVar) {
      if (!insMap[i.PRENDA_idPREND]) insMap[i.PRENDA_idPREND] = [];
      insMap[i.PRENDA_idPREND].push({
        name:   i.Nombre        || '',
        prov:   '',
        cant:   i.Cantidad      || 0,
        precio: i.Precio_unitario || 0
      });
    }

    // ── 5. Construir arrays TELAS e INSUMOS para el frontend ───────────
    const telas   = [];
    const insumos = [];

    for (const p of prendas) {
      // Rellenar hasta 4 materiales (el frontend espera exactamente 4)
      const mats = matMap[p.idPREND] || [];
      while (mats.length < 4) mats.push({ mat: '', prov: '', mts: '', precio: '' });

      telas.push({
        id:     String(p.idPREND),
        ref:    p.Referencia,
        col:    p.NombreColeccion,
        colId:  p.idCOLECCION,
        taller: p.Costo_confeccion || 0,
        m:      mats.slice(0, 4),
        ajuste: 5,    // valores por defecto — en v2 se pueden persistir
        margen: 40
      });

      // Solo crear fila de insumos si tiene al menos uno guardado
      const ins = insMap[p.idPREND] || [];
      if (ins.length) {
        // Rellenar hasta 10 insumos
        while (ins.length < 10) ins.push({ name: '', prov: '', cant: '', precio: '' });
        insumos.push({
          ref: p.Referencia,
          ins: ins.slice(0, 10)
        });
      }
    }

    return { telas, insumos };
  }
}

module.exports = PrendaModel;