/**
 * ============================================================
 * ARCHIVO: js/pane-telas.js
 * DESCRIPCIÓN: Módulo de Telas & Confección (Tab 1 del Excel).
 * Grilla horizontal con todas las referencias en filas y
 * hasta 4 materiales en columnas. Soporta carga desde Excel.
 * Depende de: utils.js, state.js, auth.js, calculator.js
 * ============================================================
 */


/**
 * Retorna un array de 4 materiales vacíos.
 * Usado al crear una nueva fila de tela sin datos.
 */
function emptyMats() {
  return Array(4).fill(null).map(() => ({
    mat: '', prov: '', mts: '', precio: ''
  }));
}


/**
 * Construye el HTML completo del pane de Telas.
 * Incluye zona de carga Excel, botones de acción y la grilla.
 */
function buildPaneTelas() {
  const pane = document.getElementById('pane-telas');
  if (!pane) return;
  const edit = canEdit('telas');

  pane.innerHTML = `
    <!-- Zona de carga desde Excel -->
    <div class="upload-zone" id="drop-telas"
         ondragover="event.preventDefault();this.classList.add('drag')"
         ondragleave="this.classList.remove('drag')"
         ondrop="handleDrop(event,'telas')"
         onclick="${edit ? "document.getElementById('file-telas').click()" : 'void(0)'}"
         style="${edit ? '' : 'pointer-events:none;opacity:.6'}">
      <span class="big">📂</span>
      <b>${edit ? 'Cargar hoja TELA desde fichero Excel' : 'Solo lectura — sin permiso de carga'}</b><br>
      <span style="font-size:10px;color:var(--tx3)">
        Columnas: Colección · Referencia · Costo Taller · Mat1 · Prov1 · Mts1 · Precio1 … (hasta Mat4)
      </span>
      <input type="file" id="file-telas" accept=".xlsx,.xls"
             style="display:none" onchange="handleFile(this,'telas')">
      <div id="upload-status-telas"
           style="margin-top:8px;font-size:11px;font-weight:600"></div>
    </div>

    <!-- Barra de acciones -->
<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
  ${edit
    ? `<button class="btn btn-g" onclick="addTelaRow()">+ Agregar fila</button>
       <button class="btn btn-o" onclick="clearTelas()">🗑 Limpiar</button>
       <button class="btn btn-g" onclick="guardarTelas()"
         style="margin-left:auto;background:#1a6b7c">
         💾 Guardar en BD
       </button>`
    : '<span class="badge ba">Solo Lectura</span>'}
  <span class="hint">Edita directo en la celda · Enter/Tab para avanzar</span>
</div>

    <!-- Grilla estilo Excel: referencias en filas, materiales en columnas -->
    <div class="xgrid-wrap">
      <table class="xgrid" id="telas-grid">
        <thead>
          <tr>
            <th class="fr" style="min-width:240px;max-width:240px">Referencia</th>
            <th colspan="2" class="gh-con" style="text-align:center">CONFECCIÓN</th>
            <th colspan="4" class="gh-prod" style="text-align:center">MATERIAL 1</th>
            <th colspan="4" class="gh-prod" style="text-align:center">MATERIAL 2</th>
            <th colspan="4" class="gh-prod" style="text-align:center">MATERIAL 3</th>
            <th colspan="4" class="gh-prod" style="text-align:center">MATERIAL 4</th>
            <th class="gh-fit num">TTL MAT</th>
            <th style="width:28px"></th>
          </tr>
          <tr>
            <th class="fr"></th>
            <th class="gh-con">Colección</th>
            <th class="gh-con num" style="min-width:110px">Costo Taller</th>
            <th class="gh-prod" style="min-width:120px">Material</th>
            <th class="gh-prod" style="min-width:90px">Proveedor</th>
            <th class="gh-prod num" style="min-width:65px">Mts</th>
            <th class="gh-prod num" style="min-width:80px">$/Unid</th>
            <th class="gh-prod" style="min-width:120px">Material</th>
            <th class="gh-prod" style="min-width:90px">Proveedor</th>
            <th class="gh-prod num" style="min-width:65px">Mts</th>
            <th class="gh-prod num" style="min-width:80px">$/Unid</th>
            <th class="gh-prod" style="min-width:120px">Material</th>
            <th class="gh-prod" style="min-width:90px">Proveedor</th>
            <th class="gh-prod num" style="min-width:65px">Mts</th>
            <th class="gh-prod num" style="min-width:80px">$/Unid</th>
            <th class="gh-prod" style="min-width:120px">Material</th>
            <th class="gh-prod" style="min-width:90px">Proveedor</th>
            <th class="gh-prod num" style="min-width:65px">Mts</th>
            <th class="gh-prod num" style="min-width:80px">$/Unid</th>
            <th class="gh-fit num" style="min-width:100px"></th>
            <th></th>
          </tr>
        </thead>
        <tbody id="telas-body"></tbody>
      </table>
    </div>`;

  renderTelas();
}


/**
 * Agrega una nueva fila de tela al array TELAS.
 * @param {Object|null} data - Datos precargados (ej: desde Excel). null = fila vacía.
 * @returns {Object} La fila creada
 */
function addTelaRow(data) {
const row = {
  id:     ID(),
  ref:    data?.ref    || '',
  col:    data?.col    || '',
  colId:  data?.colId  || '',
  taller: data?.taller || '',
    m:      data?.m      || emptyMats(),
    ajuste: data?.ajuste ?? 5,   // Ajuste USD manual por defecto = 5
    margen: data?.margen ?? 40   // Margen extra USD por defecto = 40
  };
  TELAS.push(row);
  if (!data) addHist('Agregó fila de tela', 'Telas');
  renderTelas();
  return row;
}


/**
 * Renderiza el tbody de la grilla de telas.
 * Genera inputs editables o spans de solo lectura según el rol.
 * Al finalizar sincroniza las filas de insumos y recalcula precios.
 */
function renderTelas() {
  const tbody = document.getElementById('telas-body');
  if (!tbody) return;
  const edit = canEdit('telas');

  if (!TELAS.length) {
    tbody.innerHTML = `<tr><td colspan="21"
      style="text-align:center;padding:24px;color:var(--tx3);font-style:italic">
      Sin datos · agrega una fila o carga desde Excel
    </td></tr>`;
    return;
  }

  tbody.innerHTML = TELAS.map((row) => {
    const ttl = calcTtlMat(row);

    // Generar las 4 columnas de materiales
    const matCols = row.m.map((m, mi) => edit
      // Modo edición: inputs dentro de la celda
      ? `<td><input class="ci left" value="${esc(m.mat)}" placeholder="Material…"
              onchange="updateT('${row.id}','m',${mi},'mat',this.value)"
              style="min-width:110px"></td>
         <td><input class="ci left" value="${esc(m.prov)}" placeholder="Prov."
              onchange="updateT('${row.id}','m',${mi},'prov',this.value)"
              style="min-width:80px"></td>
         <td class="num"><input class="ci" type="number" step=".01" value="${m.mts}"
              onchange="updateT('${row.id}','m',${mi},'mts',this.value)"
              style="width:60px"></td>
         <td class="num"><input class="ci" type="number" value="${m.precio}"
              onchange="updateT('${row.id}','m',${mi},'precio',this.value)"
              style="width:75px"></td>`
      // Modo solo lectura: texto estático
      : `<td><span class="cell-ro" style="text-align:left">${esc(m.mat)}</span></td>
         <td><span class="cell-ro" style="text-align:left">${esc(m.prov)}</span></td>
         <td class="num ro"><span class="cell-ro">${m.mts}</span></td>
         <td class="num ro"><span class="cell-ro">$${fmt(m.precio)}</span></td>`
    ).join('');

    return `
      <tr class="xr" data-id="${row.id}">
        <!-- Columna fija: nombre de la referencia -->
        <td class="fr">${edit
          ? `<input class="ci left" style="font-weight:600;min-width:220px"
               value="${esc(row.ref)}" placeholder="Nombre referencia…"
               onchange="updateT('${row.id}','ref',null,null,this.value)">`
          : `<span class="cell-ro" style="text-align:left;font-weight:600">${esc(row.ref)}</span>`}
        </td>
        <!-- Colección -->
       <td>${edit
        ? `<select class="ci left" style="min-width:120px"
        onchange="updateTCol('${row.id}', this.value, this.options[this.selectedIndex].text)">
        <option value="">-- Colección --</option>
        ${COLECCIONES.map(c =>
         `<option value="${c.id}" ${c.id == row.colId ? 'selected' : ''}>${esc(c.name)}</option>`
       ).join('')}
     </select>`
      : `<span class="cell-ro" style="text-align:left">${esc(row.col)}</span>`}
        </td>
        <!-- Costo Taller -->
        <td class="num">${edit
          ? `<input class="ci" type="number" value="${row.taller}"
               onchange="updateT('${row.id}','taller',null,null,this.value)"
               style="width:90px">`
          : `<span class="cell-ro">$${fmt(row.taller)}</span>`}
        </td>
        ${matCols}
        <!-- Total calculado (solo lectura siempre) -->
        <td class="ttl num ro">
          <span class="cell-ro">$${fmt(ttl)}</span>
        </td>
        <!-- Botón eliminar (solo en modo edición) -->
        <td>${edit
          ? `<button class="btn-del" onclick="deleteTelaRow('${row.id}')">✕</button>`
          : ''}
        </td>
      </tr>`;
  }).join('');

  // Al cambiar telas, sincronizar filas de insumos y recalcular
  syncInsRefs();
  recalc();
}


/**
 * Actualiza un campo de una fila de tela en el array TELAS.
 * Llamado desde los onchange de los inputs de la grilla.
 * @param {string} id       - ID de la fila
 * @param {string} field    - Campo a actualizar ('ref', 'col', 'taller', 'm')
 * @param {number|null} mi  - Índice del material (solo cuando field='m')
 * @param {string|null} sf  - Sub-campo del material ('mat','prov','mts','precio')
 * @param {string} val      - Nuevo valor
 */
function updateT(id, field, mi, sf, val) {
  const row = TELAS.find(r => r.id === id);
  if (!row) return;
  if (field === 'm') row.m[mi][sf] = val;
  else row[field] = val;
  renderTelas();
}


/**
 * Actualiza ajuste o margen de una referencia desde el Consolidado.
 * @param {string} id    - ID de la fila de tela
 * @param {string} field - 'ajuste' o 'margen'
 * @param {string} val   - Nuevo valor numérico
 */
function updateTelaField(id, field, val) {
  const r = TELAS.find(x => x.id === id);
  if (r) { r[field] = D(val); recalc(); }
}


/**
 * Elimina una fila de tela del array TELAS.
 * @param {string} id - ID de la fila a eliminar
 */
function deleteTelaRow(id) {
  TELAS = TELAS.filter(r => r.id !== id);
  renderTelas();
}


/**
 * Elimina TODAS las filas de tela tras confirmación.
 */
async function clearTelas() {
  const ok = await window.parent.confirmar('¿Borrar todas las filas de tela?', 'danger', 'Borrar todo');
  if (!ok) return;
  TELAS = [];
  renderTelas();
}


/**
 * Importa filas desde una hoja Excel (resultado de SheetJS).
 * Espera columnas en el orden:
 * Colección · Referencia · CostoTaller · Mat1 · Prov1 · Mts1 · Precio1 · ... (hasta Mat4)
 * @param {Array}   rows      - Array de arrays (filas × columnas)
 * @param {string}  sheetName - Nombre de la hoja (para historial)
 * @param {Element} statusEl  - Elemento donde mostrar el resultado
 */
function importTelasRows(rows, sheetName, statusEl) {
  let added = 0;
  rows.forEach((cols, index) => {
    if (index === 0) return; // ← saltar fila de encabezados
    const ref = String(cols[1] || '').trim();
    if (!ref) return;

    // Extraer los 4 materiales
    const m = [0, 1, 2, 3].map(i => ({
      mat:    String(cols[3 + i * 4] || '').trim(),
      prov:   String(cols[4 + i * 4] || '').trim(),
      mts:    cleanNum(cols[5 + i * 4]),
      precio: cleanNum(cols[6 + i * 4])
    }));

    // Solo importar si tiene al menos un material con nombre
    if (!m.some(x => x.mat)) return;

    TELAS.push({
      id:     ID(),
      ref,
      col:    String(cols[0] || '').trim(),
      taller: cleanNum(cols[2]),
      m,
      ajuste: 5,   // Valores por defecto al importar
      margen: 40
    });
    added++;
  });

addHist(`Importó ${added} telas`, 'Telas', sheetName);

  // Reconstruir y renderizar dentro del subpane correcto
  const sub = document.getElementById('subpane-telas');
  if (sub) {
    sub.id = 'pane-telas';
    buildPaneTelas();
    sub.id = 'subpane-telas';
    // renderTelas necesita el tbody que acaba de crear buildPaneTelas
    // pero ya con el id correcto restaurado, así que lo llamamos apuntando directo
    const tbody = sub.querySelector('#telas-body');
    if (tbody) renderTelas();
  } else {
    // fallback: no hay subpane, renderizar normal
    buildPaneTelas();
  }

  switchSubtab('telas');

  if (statusEl) {
    statusEl.textContent = `✓ ${added} referencia(s) importadas`;
    statusEl.style.color = 'var(--g1)';
  }
  toast(`✓ Telas: ${added} referencias cargadas`);
}

/**
 * Construye el pane combinado Telas + Insumos con subtabs internos.
 */
function buildPaneMateria() {
  const pane = document.getElementById('pane-materia');
  if (!pane) return;

  pane.innerHTML = `
    <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--g3)">
      <button id="subtab-telas"
        onclick="switchSubtab('telas')"
        style="padding:8px 20px;border:none;background:var(--g1);color:var(--bg);
               font-family:var(--sans);font-size:13px;font-weight:700;cursor:pointer;
               border-radius:6px 6px 0 0;margin-right:4px">
        📐 Telas & Confección
      </button>
      <button id="subtab-insumos"
        onclick="switchSubtab('insumos')"
        style="padding:8px 20px;border:none;background:transparent;color:var(--tx2);
               font-family:var(--sans);font-size:13px;font-weight:600;cursor:pointer;
               border-radius:6px 6px 0 0">
        🪡 Insumos
      </button>
    </div>
    <div id="subpane-telas"></div>
    <div id="subpane-insumos" style="display:none"></div>
  `;

  // Redirigir buildPaneTelas y buildPaneInsumos a los subpanes
  buildSubPaneTelas();
  buildSubPaneInsumos();
}

function switchSubtab(which) {
  const showTelas   = which === 'telas';
  document.getElementById('subpane-telas').style.display   = showTelas ? '' : 'none';
  document.getElementById('subpane-insumos').style.display = showTelas ? 'none' : '';

  const btnT = document.getElementById('subtab-telas');
  const btnI = document.getElementById('subtab-insumos');
  btnT.style.background = showTelas ? 'var(--g1)' : 'transparent';
  btnT.style.color      = showTelas ? 'var(--bg)' : 'var(--tx2)';
  btnI.style.background = showTelas ? 'transparent' : 'var(--g1)';
  btnI.style.color      = showTelas ? 'var(--tx2)' : 'var(--bg)';
}

function buildSubPaneTelas() {
  const sub = document.getElementById('subpane-telas');
  if (!sub) return;
  sub.id = 'pane-telas';
  buildPaneTelas();
  // NO restaurar el id aquí — renderTelas ya corrió dentro de buildPaneTelas
  // Restaurar después de que el DOM quedó pintado
  sub.id = 'subpane-telas';
}

function buildSubPaneInsumos() {
  const sub = document.getElementById('subpane-insumos');
  if (!sub) return;
  sub.id = 'pane-insumos';
  buildPaneInsumos();
  sub.id = 'subpane-insumos';
}

async function guardarTelas() {
  if (!TELAS.length) { toast('⚠ No hay datos para guardar', 'error'); return; }

  const API   = window.parent?.API_URL || 'http://localhost:3000/api';
  const token = window.parent?.kikaToken || sessionStorage.getItem('kika_token');
  const fijosTotal = calcTtlFijos();

  let ok = 0, err = 0;
  for (const row of TELAS) {
    const materiales = row.m
      .filter(m => m.mat)
      .map(m => ({ Nombre: m.mat, Mts: +m.mts || 0, Precio: +m.precio || 0 }));

    const insRow = INSUMOS.find(i => i.ref === row.ref);
    const insumos = insRow
      ? insRow.ins.filter(i => i.name).map(i => ({
          name: i.name, cant: +i.cant || 0, precio: +i.precio || 0
        }))
      : [];

    try {
      const res = await fetch(`${API}/prendas/guardar`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ref:         row.ref,
          colId:       row.colId || null,
          taller:      +row.taller || 0,
          ttlMat:      calcTtlMat(row),
          ttlInsVar:   insRow ? calcTtlVar(insRow) : 0,
          ttlInsFijos: fijosTotal,
          costoTotal:  calcTtlMat(row) + (insRow ? calcTtlVar(insRow) : 0) + fijosTotal,
          materiales,
          insumos
        })
      });
      const json = await res.json();
      if (json.ok) ok++; else err++;
    } catch { err++; }
  }

  // Guardar insumos fijos también
  await fetch(`${API}/prendas/insumos-fijos`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ fijos: FIJOS })
  });

  toast(err ? `⚠ ${ok} guardadas, ${err} con error` : `✓ ${ok} prendas guardadas en BD`);
}

function updateTCol(id, colId, colName) {
  const r = TELAS.find(x => x.id === id);
  if (!r) return;
  r.colId = colId;
  r.col   = colName;
}