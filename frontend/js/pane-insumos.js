/**
 * ============================================================
 * ARCHIVO: js/pane-insumos.js
 * DESCRIPCIÓN: Módulo de Insumos Variables e Insumos Fijos.
 * Grilla con hasta 10 insumos por referencia + gestión de
 * insumos fijos comunes a todas las prendas.
 * Depende de: utils.js, state.js, auth.js, calculator.js
 * ============================================================
 */


/**
 * Retorna un array de 10 insumos variables vacíos.
 * Usado al crear una nueva fila de insumos sin datos.
 */
function emptyIns() {
  return Array(10).fill(null).map(() => ({
    name: '', prov: '', cant: '', precio: ''
  }));
}


/**
 * Insumos fijos predeterminados basados en el Excel original.
 * Etiquetas, bolsas, ganchos y hang tags estándar de la marca.
 */
const DEFAULT_FIJOS = [
  { name: 'Etiquetas Cuidado', precio: 70,   qty: 1 },
  { name: 'Etiquetas KV',      precio: 390,  qty: 1 },
  { name: 'Etiquetas Talla',   precio: 63,   qty: 1 },
  { name: 'Bolsa 42 X 58',     precio: 400,  qty: 1 },
  { name: 'Sticker',           precio: 49,   qty: 1 },
  { name: 'Gancho',            precio: 3918, qty: 1 },
  { name: 'Hang Tag',          precio: 1220, qty: 1 },
];


/**
 * Carga los 7 insumos fijos predeterminados del Excel.
 * Reemplaza los existentes.
 */
function seedFijos() {
  FIJOS = DEFAULT_FIJOS.map(f => ({ id: ID(), ...f }));
  renderFijosModal();
  renderFijosSummary();
  recalc();
  toast('✓ 7 insumos fijos cargados desde defaults Excel');
}


/**
 * Agrega una fila vacía al array de insumos fijos.
 */
function addFijoRow() {
  FIJOS.push({ id: ID(), name: '', precio: 0, qty: 1 });
  renderFijosModal();
}


/**
 * Abre el modal de configuración de insumos fijos.
 * Solo disponible para roles con permiso de edición.
 */
function showFijosModal() {
  if (!canEdit('fijos')) {
    toast('⛔ Sin permiso para editar insumos fijos');
    return;
  }
  renderFijosModal();
  document.getElementById('fijos-modal').style.display = 'flex';
}


/**
 * Cierra el modal de insumos fijos y actualiza todos los cálculos.
 */
function closeFijosModal() {
  document.getElementById('fijos-modal').style.display = 'none';
  renderFijosSummary();
  renderInsumos();
  recalc();
}


/**
 * Renderiza la tabla de insumos fijos dentro del modal.
 * Permite editar nombre, precio y cantidad directamente.
 */
function renderFijosModal() {
  const tbody = document.getElementById('fijos-body');
  if (!tbody) return;

  tbody.innerHTML = FIJOS.map((f, i) => `
    <tr>
      <td><input class="ci left" value="${esc(f.name)}"
            onchange="FIJOS[${i}].name=this.value"
            style="width:180px"></td>
      <td class="num">
        <input class="ci" type="number" value="${f.precio}"
               onchange="FIJOS[${i}].precio=+this.value;renderFijosModal()"
               style="width:80px">
      </td>
      <td class="num">
        <input class="ci" type="number" value="${f.qty}"
               onchange="FIJOS[${i}].qty=+this.value;renderFijosModal()"
               style="width:50px">
      </td>
      <td class="ttl num ro">
        <span class="cell-ro">$${fmt(D(f.precio) * D(f.qty))}</span>
      </td>
      <td>
        <button class="btn-del"
          onclick="FIJOS.splice(${i},1);renderFijosModal()">✕</button>
      </td>
    </tr>`).join('');

  // Mostrar el total en el pie de tabla
  document.getElementById('fijos-total-modal').textContent =
    '$ ' + fmt(calcTtlFijos());
}


/**
 * Renderiza el resumen de insumos fijos en el banner superior del pane.
 * Muestra cada insumo como un chip verde con su total.
 */
function renderFijosSummary() {
  const s = document.getElementById('fijos-summary');
  if (!s) return;
  const total = calcTtlFijos();

  if (!FIJOS.length) {
    s.innerHTML = '<span style="font-size:11px;color:var(--tx3)">Sin insumos fijos · usa ⚙ Configurar</span>';
    return;
  }

  s.innerHTML =
    '<span style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--tx3)">Fijos/prenda:</span>' +
    FIJOS.map(f =>
      `<span class="badge bg">${esc(f.name)} $${fmt(D(f.precio) * D(f.qty))}</span>`
    ).join('') +
    `<span class="badge bb" style="font-family:var(--mono)">TOTAL $${fmt(total)}</span>`;
}


/**
 * Construye el HTML completo del pane de Insumos.
 * Incluye zona de carga Excel, banner de fijos y grilla de 10 columnas.
 */
function buildPaneInsumos() {
  const pane = document.getElementById('pane-insumos');
  if (!pane) return;
  const edit = canEdit('insumos');

  // Generar encabezados para los 10 insumos variables
  const insHeaders = [...Array(10)].map((_, n) =>
    `<th colspan="4" class="gh-ins" style="text-align:center">INS VAR ${n + 1}</th>`
  ).join('');

  const insSubH = [...Array(10)].map(() =>
    `<th class="gh-ins" style="min-width:110px">Insumo</th>
     <th class="gh-ins" style="min-width:80px">Proveedor</th>
     <th class="gh-ins num" style="min-width:55px">Cant</th>
     <th class="gh-ins num" style="min-width:75px">$/Unid</th>`
  ).join('');

  pane.innerHTML = `
    <!-- Zona de carga desde Excel -->
    <div class="upload-zone" id="drop-insumos"
         ondragover="event.preventDefault();this.classList.add('drag')"
         ondragleave="this.classList.remove('drag')"
         ondrop="handleDrop(event,'insumos')"
         onclick="${edit ? "document.getElementById('file-insumos').click()" : 'void(0)'}"
         style="${edit ? '' : 'pointer-events:none;opacity:.6'}">
      <span class="big">📂</span>
      <b>${edit ? 'Cargar hoja INSUMOS desde fichero Excel' : 'Solo lectura'}</b>
      <input type="file" id="file-insumos" accept=".xlsx,.xls"
             style="display:none" onchange="handleFile(this,'insumos')">
      <div id="upload-status-insumos"
           style="margin-top:8px;font-size:11px;font-weight:600"></div>
    </div>

    <!-- Barra de acciones -->
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
      ${edit
        ? `<button class="btn btn-g" onclick="addInsRow()">+ Agregar fila</button>
           <button class="btn btn-o btn-sm" onclick="showFijosModal()">⚙ Insumos Fijos</button>`
        : '<span class="badge ba">Solo Lectura</span>'}
    </div>

    <!-- Banner resumen de insumos fijos -->
    <div id="fijos-summary"
         style="margin-bottom:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
    </div>

    <!-- Grilla: referencias en filas, 10 insumos en columnas -->
    <div class="xgrid-wrap">
      <table class="xgrid" id="insumos-grid">
        <thead>
          <tr>
            <th class="fr" style="min-width:240px;max-width:240px">Referencia</th>
            ${insHeaders}
            <th colspan="2" class="gh-fit" style="text-align:center">TOTALES</th>
            <th style="width:28px"></th>
          </tr>
          <tr>
            <th class="fr"></th>
            ${insSubH}
            <th class="gh-fit num" style="min-width:100px">TTL VAR</th>
            <th class="gh-fit num" style="min-width:100px">TTL FIJOS</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="insumos-body"></tbody>
      </table>
    </div>`;

  renderFijosSummary();
  renderInsumos();
}


/**
 * Agrega una nueva fila de insumos al array INSUMOS.
 * @param {Object|null} data - Datos precargados o null para fila vacía
 * @returns {Object} La fila creada
 */
function addInsRow(data) {
  const row = {
    id:  ID(),
    ref: data?.ref || TELAS[0]?.ref || '',
    ins: data?.ins || emptyIns()
  };
  INSUMOS.push(row);
  renderInsumos();
  return row;
}


/**
 * Sincroniza las filas de INSUMOS con las de TELAS.
 * Si existe una referencia en TELAS sin fila en INSUMOS, la crea vacía.
 * Garantiza que cada referencia pueda tener insumos asignados.
 */
function syncInsRefs() {
  let changed = false;
  TELAS.forEach(t => {
    if (t.ref && !INSUMOS.find(i => i.ref === t.ref)) {
      INSUMOS.push({ id: ID(), ref: t.ref, ins: emptyIns() });
      changed = true;
    }
  });
  if (changed) renderInsumos();
}


/**
 * Renderiza el tbody de la grilla de insumos.
 * Genera inputs editables o spans de solo lectura según el rol.
 */
function renderInsumos() {
  const tbody = document.getElementById('insumos-body');
  if (!tbody) return;
const edit = canEdit('insumos');

  if (!INSUMOS.length) {
    tbody.innerHTML = `<tr><td colspan="43"
      style="text-align:center;padding:24px;color:var(--tx3);font-style:italic">
      Sin datos · agrega filas en Telas primero o carga desde Excel
    </td></tr>`;
    return;
  }

  tbody.innerHTML = INSUMOS.map(row => {
    const ttlVar = calcTtlVar(row);

    // Generar 10 grupos de columnas de insumo
    const insCols = row.ins.map((ins, ii) => edit
      ? `<td><input class="ci left" value="${esc(ins.name)}" placeholder="Insumo…"
              onchange="updateI('${row.id}',${ii},'name',this.value)"
              style="min-width:100px"></td>
         <td><input class="ci left" value="${esc(ins.prov)}" placeholder="Prov."
              onchange="updateI('${row.id}',${ii},'prov',this.value)"
              style="min-width:75px"></td>
         <td class="num"><input class="ci" type="number" step=".01" value="${ins.cant}"
              onchange="updateI('${row.id}',${ii},'cant',this.value)"
              style="width:50px"></td>
         <td class="num"><input class="ci" type="number" value="${ins.precio}"
              onchange="updateI('${row.id}',${ii},'precio',this.value)"
              style="width:72px"></td>`
      : `<td><span class="cell-ro" style="text-align:left">${esc(ins.name)}</span></td>
         <td><span class="cell-ro" style="text-align:left">${esc(ins.prov)}</span></td>
         <td class="num ro"><span class="cell-ro">${ins.cant}</span></td>
         <td class="num ro"><span class="cell-ro">$${fmt(ins.precio)}</span></td>`
    ).join('');

    return `
      <tr class="xr" data-id="${row.id}">
        <td class="fr">${edit
          ? `<input class="ci left" style="font-weight:600;min-width:220px"
               value="${esc(row.ref)}"
               onchange="updateI('${row.id}',null,'ref',this.value)">`
          : `<span class="cell-ro" style="text-align:left;font-weight:600">${esc(row.ref)}</span>`}
        </td>
        ${insCols}
        <!-- Total variables (calculado) -->
        <td class="ttl num ro"><span class="cell-ro">$${fmt(ttlVar)}</span></td>
        <!-- Total fijos (igual para todas las referencias) -->
        <td class="grn num ro"><span class="cell-ro">$${fmt(calcTtlFijos())}</span></td>
        <td>${edit
          ? `<button class="btn-del" onclick="deleteInsRow('${row.id}')">✕</button>`
          : ''}
        </td>
      </tr>`;
  }).join('');

  recalc();
}


/**
 * Actualiza un campo de una fila de insumos.
 * @param {string}      id    - ID de la fila
 * @param {number|null} ii    - Índice del insumo (null si es el campo 'ref')
 * @param {string}      field - Campo a actualizar
 * @param {string}      val   - Nuevo valor
 */
function updateI(id, ii, field, val) {
  const row = INSUMOS.find(r => r.id === id);
  if (!row) return;
  if (field === 'ref') row.ref = val;
  else row.ins[ii][field] = val;
  renderInsumos();
}


/**
 * Elimina una fila de insumos.
 * @param {string} id - ID de la fila a eliminar
 */
function deleteInsRow(id) {
  INSUMOS = INSUMOS.filter(r => r.id !== id);
  renderInsumos();
}


/**
 * Importa filas de insumos desde Excel (resultado de SheetJS).
 * Formato esperado: Referencia · Ins1 · Prov1 · Cant1 · Precio1 · ... (hasta Ins10)
 * @param {Array}   rows      - Filas del Excel
 * @param {string}  sheetName - Nombre de la hoja
 * @param {Element} statusEl  - Elemento donde mostrar el resultado
 */
function importInsumosRows(rows, sheetName, statusEl) {
  let added = 0;
  rows.forEach((cols, index) => {
    if (index === 0) return; // ← saltar fila de encabezados
const ref = String(cols[1] || '').trim();
    if (!ref) return;

    // Extraer los 10 insumos variables
const ins = [0,1,2,3,4,5,6,7,8,9].map(i => ({
  name:   String(cols[2 + i * 4] || '').trim(),
  prov:   String(cols[3 + i * 4] || '').trim(),
  cant:   cleanNum(cols[4 + i * 4]),
  precio: cleanNum(cols[5 + i * 4])
}));

    if (!ins.some(x => x.name)) return;

    // Actualizar si ya existe, crear si no
    const existing = INSUMOS.find(r => r.ref === ref);
    if (existing) existing.ins = ins;
    else INSUMOS.push({ id: ID(), ref, ins });
    added++;
  });

addHist(`Importó ${added} insumos`, 'Insumos', sheetName);

  const sub = document.getElementById('subpane-insumos');
  if (sub) {
    sub.id = 'pane-insumos';
    buildPaneInsumos();
    sub.id = 'subpane-insumos';
    const tbody = sub.querySelector('#insumos-body');
    if (tbody) renderInsumos();
  } else {
    buildPaneInsumos();
  }

  switchSubtab('insumos');

  if (statusEl) {
    statusEl.textContent = `✓ ${added} referencia(s) importadas`;
    statusEl.style.color = 'var(--g1)';
  }
  toast(`✓ Insumos: ${added} referencias cargadas`);

  // Re-renderizar después de que importFijosRows termine de cargar FIJOS
  setTimeout(() => {
    renderInsumos();
    renderFijosSummary();
  }, 50);
}
