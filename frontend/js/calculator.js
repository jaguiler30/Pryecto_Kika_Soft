/**
 * ============================================================
 * ARCHIVO: js/calculator.js
 * DESCRIPCIÓN: Motor de cálculo del sistema de costeo textil.
 * Replica exactamente las fórmulas del Excel COMPARATIVO
 * (hoja PF-FW 26 CONSOLIDADO). Todas las funciones son puras:
 * reciben datos, retornan resultados, sin efectos secundarios.
 * Se debe cargar ANTES de cualquier pane que use calcRow().
 * ============================================================
 */


/**
 * Calcula el total de materiales (telas) de una referencia.
 * Recorre el array de 4 materiales y suma metros × precio/unidad.
 * @param {Object} row - Fila de TELAS con array m:[{mts, precio}]
 * @returns {number} Total COP de materiales
 */
function calcTtlMat(row) {
  return (row.m || []).reduce((sum, m) => sum + D(m.mts) * D(m.precio), 0);
}


/**
 * Calcula el total de insumos variables de una referencia.
 * Recorre hasta 10 insumos y suma cantidad × precio/unidad.
 * @param {Object} row - Fila de INSUMOS con array ins:[{cant, precio}]
 * @returns {number} Total COP de insumos variables
 */
function calcTtlVar(row) {
  return (row.ins || []).reduce((sum, i) => sum + D(i.cant) * D(i.precio), 0);
}


/**
 * Calcula el total de insumos fijos por prenda.
 * Los insumos fijos (etiquetas, bolsas, ganchos, etc.) son iguales
 * para TODAS las referencias de la colección.
 * @returns {number} Total COP de insumos fijos por prenda
 */
function calcTtlFijos() {
  return FIJOS.reduce((sum, f) => sum + D(f.precio) * D(f.qty), 0);
}


/**
 * Retorna los parámetros globales del panel de Consolidado.
 * Si el panel no está en el DOM (rol sin acceso), usa valores default.
 * @returns {Object} Objeto con todos los parámetros de cálculo
 */
function getParams() {
  // Verificar si el panel de Consolidado está en el DOM
  const el = id => document.getElementById(id);
  if (!el('p-trm')) return getDefaultParams();

  const v = id => D(el(id)?.value);
  return {
    trm:    v('p-trm'),              // Tasa de cambio COP/USD
    kvMkup: v('p-mkup'),             // Multiplicador KV (ej: 2.8)
    exp:    pct(v('p-exp')),         // % Exportación → decimal
    aran:   pct(v('p-aran')),        // % Aranceles → decimal
    amer:   pct(v('p-amer')),        // % Amerindias bodega → decimal
    fact:   pct(v('p-fact')),        // % Factoring → decimal
    rtMkup: v('p-rt'),               // Multiplicador RT (ej: 2.4)
    ten11:  pct(v('p-10e')),         // % Comisión 10Eleven → decimal
    iva:    pct(v('p-iva')),         // % IVA → decimal
    imprev: pct(v('p-imprev')),      // % Imprevistos → decimal
    finM:   pct(v('p-finm')),        // % Costo financiero mensual → decimal
    finMes: v('p-finmes'),           // Meses del ciclo financiero
    seg:    v('p-seg'),              // Seguro anual total COP
    np:     v('p-np') || 1          // Número de prendas en la colección
  };
}


/**
 * Valores por defecto usados cuando el panel de Consolidado
 * no está en el DOM (roles sin acceso a ese módulo).
 * Basados en los valores del Excel original.
 * @returns {Object} Parámetros con valores predeterminados
 */
function getDefaultParams() {
  return {
    trm:    3700,
    kvMkup: 2.8,
    exp:    0.15,
    aran:   0.10,
    amer:   0.03,
    fact:   0.04,
    rtMkup: 2.4,
    ten11:  0.15,
    iva:    0.19,
    imprev: 0.10,
    finM:   0.015,
    finMes: 6,
    seg:    15000000,
    np:     5000
  };
}


/**
 * FUNCIÓN PRINCIPAL: Calcula la cadena de precios completa
 * para una referencia. Replica exactamente el orden de columnas
 * del Excel COMPARATIVO (hoja PF-FW 26).
 *
 * CADENA DE CÁLCULO:
 * [Producción COP] → [Financiero] → [USD/Markup] →
 * [Exportación] → [Logística] → [Precios Finales]
 *
 * @param {Object} tRow  - Fila de TELAS (materiales y taller)
 * @param {Object} iRow  - Fila de INSUMOS (puede ser null)
 * @param {Object} p     - Parámetros globales de getParams()
 * @returns {Object} Todos los valores intermedios y finales
 */
function calcRow(tRow, iRow, p) {

  // ── BLOQUE 1: COSTOS DE PRODUCCIÓN COP ─────────────────────
  const mat  = calcTtlMat(tRow);                // Total materiales (telas)
  const insV = iRow ? calcTtlVar(iRow) : 0;     // Total insumos variables
  const insF = calcTtlFijos();                  // Total insumos fijos
  const ins  = insV + insF;                     // Total insumos (var + fijos)
  const tal  = D(tRow.taller);                  // Costo confección/taller
  const seg  = p.seg / p.np;                   // Seguro por prenda

  // SUB TL 1: Base de producción
  const sub1 = mat + ins + tal + seg;

  // ── BLOQUE 2: COSTOS FINANCIEROS ───────────────────────────
  // Costo de financiar el IVA durante el ciclo de producción
  // Fórmula: SUB TL 1 × IVA% × tasa_mensual% × meses
  const finIva = sub1 * p.iva * p.finM * p.finMes;

  // Imprevistos: % sobre (sub1 + costo financiero IVA)
  const imprev = (sub1 + finIva) * p.imprev;

  // SUB TL 2: Costo real total de producción en COP
  const sub2 = sub1 + finIva + imprev;

  // ── BLOQUE 3: CONVERSIÓN A USD Y MARKUP ────────────────────
  // Convertir de COP a USD usando TRM
  const usd = sub2 / p.trm;

  // Aplicar multiplicador KV (markup de marca)
  const kv = usd * p.kvMkup;

  // Ajuste manual por referencia (se SUMA, no multiplica)
  // Permite bajar o subir el precio de cada prenda individualmente
  const adj = kv + D(tRow.ajuste);

  // Margen extra fijo en USD
  const sub4 = adj + D(tRow.margen);

  // ── BLOQUE 4: EXPORTACIÓN Y ARANCELES ──────────────────────
  // Costos de exportación sobre SUB TL 4
  const expA = sub4 * p.exp;

  // Aranceles sobre SUB TL 4 (no sobre sub4 + export)
  const araA = sub4 * p.aran;

  // SUB TL 5: precio con exportación y aranceles
  const sub5 = sub4 + expA + araA;

  // ── BLOQUE 5: LOGÍSTICA Y CANAL ────────────────────────────
  // Costo bodega Amerindias
  const amerA = sub5 * p.amer;

  // Factoring (costo de cobrar la cartera)
  const factA = (sub5 + amerA) * p.fact;

  // Comisión showroom 10Eleven
  const sub7 = sub5 + amerA + factA;
  const t11  = sub7 * p.ten11;

  // ── BLOQUE 6: PRECIOS FINALES ───────────────────────────────
  // WS USD: Precio mayorista (Wholesale)
  const ws = sub7 + t11;

  // RT USD: Precio minorista (Retail) = WS × multiplicador RT
  const rt = ws * p.rtMkup;

  // Precio SAS COP: WS USD reconvertido a pesos colombianos
  const cop = ws * p.trm;

  // Precio Retail COP: RT USD reconvertido a pesos colombianos
  const rtCop = rt * p.trm;

  // Retornar TODOS los valores para mostrar en el Consolidado
  return {
    mat, ins, tal, seg,
    sub1, finIva, imprev, sub2,
    usd, kv, adj, sub4,
    expA, araA, sub5,
    amerA, factA, t11,
    ws, rt, cop, rtCop
  };
}
