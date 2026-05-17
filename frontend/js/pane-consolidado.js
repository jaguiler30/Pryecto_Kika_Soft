/**
 * ============================================================
 * ARCHIVO: js/pane-consolidado.js
 * DESCRIPCIÓN: Módulo del Consolidado de Precios.
 * Replica exactamente el orden de columnas del Excel COMPARATIVO
 * (hoja PF-FW 26). Solo visible para Admin y Jefe de Finanzas.
 * Incluye parámetros globales editables y exportación CSV.
 * Depende de: utils.js, state.js, auth.js, calculator.js
 * ============================================================
 */


/**
 * Construye el HTML completo del pane de Consolidado.
 * Si el rol no tiene acceso, muestra pantalla de acceso denegado.
 */
function buildPaneConsolidado() {
  const pane = document.getElementById('pane-consolidado');
  if (!pane) return;

  // Verificar acceso: solo Admin y Finanzas
  const canSee = ['admin', 'finanzas'].includes(currentUser?.role);
  if (!canSee) {
    pane.innerHTML = `
      <div class="access-denied">
        <div class="ad-icon">🔒</div>
        <h3>Acceso restringido</h3>
        <p>El Consolidado de Precios es accesible solo para
           Administrador y Jefe de Finanzas.</p>
      </div>`;
    return;
  }

  const edit = canEdit('consolidado');

  pane.innerHTML = `
    <!-- ── SELECTOR DE COLECCIÓN ─────────────────────────────── -->
    <div class="card" id="col-selector-card" style="margin-bottom:14px">
      <div class="card-head" style="align-items:center;gap:12px">
        <h3 style="margin:0">📁 Seleccionar Colección</h3>
        <select id="sel-coleccion"
          style="font-family:var(--sans);font-size:13px;padding:6px 10px;
                 border:1.5px solid var(--g3);border-radius:var(--r);
                 background:var(--bg);color:var(--tx1);min-width:220px;cursor:pointer"
          onchange="onColeccionChange(this.value)">
          <option value="">— Todas las colecciones —</option>
        </select>
        <button class="btn btn-g btn-sm" id="btn-cargar-col"
          onclick="cargarColeccionSeleccionada()"
          style="margin-left:4px">
          ▶ Cargar
        </button>
        <span id="col-estado"
          style="font-size:11px;color:var(--tx3);margin-left:8px"></span>
      </div>
    </div>

    <!-- Panel de Parámetros Globales -->
    <div class="card" id="params-card">
      <div class="card-head">
        <h3>⚙ Parámetros Globales</h3>
        <button class="btn btn-o btn-sm" onclick="toggleParams()">
          ▼ Mostrar/Ocultar
        </button>
      </div>
      <div id="params-body">
        <div class="params-grid">
          <!-- Cada input tiene readonly si el rol es solo lectura -->
          <div class="pf">
            <label>TRM (COP/USD)</label>
            <input id="p-trm" type="number" value="3700"
                   ${edit ? '' : 'readonly'}
                   onchange="onTrmChange(this.value)">
          </div>
          <div class="pf">
            <label>KV Markup ×</label>
            <input id="p-mkup" type="number" value="2.8" step=".1"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>Exportación %</label>
            <input id="p-exp" type="number" value="15"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>Aranceles %</label>
            <input id="p-aran" type="number" value="10"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>Amerindias %</label>
            <input id="p-amer" type="number" value="3" step=".5"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>Factoring %</label>
            <input id="p-fact" type="number" value="4" step=".5"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>RT Markup ×</label>
            <input id="p-rt" type="number" value="2.4" step=".1"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>10Eleven %</label>
            <input id="p-10e" type="number" value="15"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>IVA %</label>
            <input id="p-iva" type="number" value="19"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>Imprevistos %</label>
            <input id="p-imprev" type="number" value="10"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>Fin. Mensual %</label>
            <input id="p-finm" type="number" value="1.5" step=".25"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>Fin. Meses</label>
            <input id="p-finmes" type="number" value="6"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>Seguro Anual COP</label>
            <input id="p-seg" type="number" value="15000000"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
          <div class="pf">
            <label>N° Prendas</label>
            <input id="p-np" type="number" value="5000"
                   ${edit ? '' : 'readonly'} onchange="recalc()">
          </div>
        </div>
      </div>
    </div>

    <!-- KPIs resumen -->
    <div class="metrics">
      <div class="metric">
        <div class="ml">Referencias</div>
        <div class="mv g" id="m-refs">0</div>
      </div>
      <div class="metric">
        <div class="ml">Prod. COP Prom.</div>
        <div class="mv g" id="m-cop">$ 0</div>
      </div>
      <div class="metric">
        <div class="ml">WS USD Prom.</div>
        <div class="mv b" id="m-ws">USD 0</div>
      </div>
      <div class="metric">
        <div class="ml">RT USD Prom.</div>
        <div class="mv a" id="m-rt">USD 0</div>
      </div>
    </div>

    <!-- Tabla principal del Consolidado -->
    <div class="xgrid-wrap">
      <table class="xgrid" id="consol-table" style="min-width:3200px">
        <thead>
          <!-- Fila 1: Grupos de columnas -->
          <tr>
            <th class="fr" style="min-width:220px;max-width:220px" rowspan="2">REFERENCIA</th>
            <th colspan="5" class="gh-prod" style="text-align:center">PRODUCCIÓN COP</th>
            <th colspan="3" class="gh-con"  style="text-align:center">FINANCIERO</th>
            <th colspan="4" class="gh-usd"  style="text-align:center">USD · MARKUP</th>
            <th colspan="3" class="gh-exp"  style="text-align:center">EXPORTACIÓN</th>
            <th colspan="4" class="gh-ins"  style="text-align:center">LOGÍSTICA</th>
            <th colspan="4" class="gh-fin"  style="text-align:center">PRECIOS FINALES</th>
          </tr>
          <!-- Fila 2: Columnas individuales -->
          <tr>
            <th class="gh-prod num" style="min-width:110px">MAT. PRIMA</th>
            <th class="gh-prod num" style="min-width:110px">INSUMOS</th>
            <th class="gh-prod num" style="min-width:110px">TALLER</th>
            <th class="gh-prod num" style="min-width:100px">SEGURO</th>
            <th class="gh-prod sub" style="min-width:120px">SUB TL 1</th>
            <th class="gh-con  num" style="min-width:100px">FIN. IVA</th>
            <th class="gh-con  num" style="min-width:100px">IMPREV.</th>
            <th class="gh-con  sub" style="min-width:120px">SUB TL 2</th>
            <th class="gh-usd  usd" style="min-width:100px">USD</th>
            <th class="gh-usd  usd" style="min-width:110px">× KV MKUP</th>
            <!-- AJUSTE: editable por referencia para bajar precio manualmente -->
            <th class="gh-usd  usd" style="min-width:100px;background:#EBF4FF">
              AJUSTE<br><small style="font-size:8px">editable</small>
            </th>
            <!-- MARGEN: editable por referencia -->
            <th class="gh-usd  usd sub" style="min-width:110px">
              + MARGEN<br><small style="font-size:8px">editable</small>
            </th>
            <th class="gh-exp  num" style="min-width:110px">+ EXPORT</th>
            <th class="gh-exp  num" style="min-width:110px">+ ARAN</th>
            <th class="gh-exp  sub" style="min-width:120px">SUB TL 5</th>
            <th class="gh-ins  num" style="min-width:100px">+ AMER</th>
            <th class="gh-ins  num" style="min-width:100px">+ FACTOR</th>
            <th class="gh-ins  num" style="min-width:110px">+ 10ELEVEN</th>
            <th class="gh-ins  usd sub" style="min-width:120px">WS USD ✓</th>
            <th class="gh-fin  usd" style="min-width:100px">RT MKUP</th>
            <th class="gh-fin  usd fin" style="min-width:120px">RT USD ✓</th>
            <th class="gh-fin  num"
                style="min-width:140px;background:#FFF9C4">
              WS × TRM<br><small>PRECIO SAS COP</small>
            </th>
            <th class="gh-fin  fin"
                style="min-width:150px;background:#FFB74D">
              RT × TRM<br><small>PRECIO RETAIL COP</small>
            </th>
          </tr>
        </thead>
        <tbody id="consol-body">
          <tr>
            <td colspan="24"
                style="text-align:center;padding:32px;color:var(--tx3)">
              Sin datos · carga referencias en Tab Telas
            </td>
          </tr>
        </tbody>
      </table>
    </div>`;
}


/**
 * Recalcula y renderiza todas las filas del Consolidado.
 * Se llama automáticamente al:
 *   - Activar el tab de Consolidado
 *   - Cambiar cualquier parámetro global
 *   - Modificar ajuste o margen de una referencia
 *   - Cargar datos (demo o Excel)
 */
function recalc() {
  const tbody = document.getElementById('consol-body');
  if (!tbody) return;

  if (!TELAS.length) {
    tbody.innerHTML = `<tr><td colspan="24"
      style="text-align:center;padding:32px;color:var(--tx3)">
      Sin referencias · carga datos en Tab Telas
    </td></tr>`;
    updateMetrics([]);
    return;
  }

  const p    = getParams();
  const edit = canEdit('consolidado');

  // Calcular todos los valores para cada referencia
  const rows = TELAS.map(t => ({
    ref:    t.ref,
    tId:    t.id,
    ajuste: t.ajuste,
    margen: t.margen,
    c:      calcRow(t, INSUMOS.find(i => i.ref === t.ref), p)
  }));

  // Generar filas HTML
  tbody.innerHTML = rows.map(({ ref, tId, ajuste, margen, c }) => `
    <tr class="xr">
      <!-- Referencia (columna fija) -->
      <td class="fr" style="font-weight:600;font-size:11px"
          title="${esc(ref)}">
        ${ref.length > 34 ? ref.slice(0, 32) + '…' : ref}
      </td>
      <!-- Costos COP -->
      <td class="num" style="font-family:var(--mono);font-size:11px">$${fmt(c.mat)}</td>
      <td class="num" style="font-family:var(--mono);font-size:11px">$${fmt(c.ins)}</td>
      <td class="num" style="font-family:var(--mono);font-size:11px">$${fmt(c.tal)}</td>
      <td class="num" style="font-family:var(--mono);font-size:11px">$${fmt(c.seg)}</td>
      <td class="sub num">$${fmt(c.sub1)}</td>
      <!-- Financiero -->
      <td class="num" style="font-family:var(--mono);font-size:11px">$${fmt(c.finIva)}</td>
      <td class="num" style="font-family:var(--mono);font-size:11px">$${fmt(c.imprev)}</td>
      <td class="sub num">$${fmt(c.sub2)}</td>
      <!-- USD / Markup -->
      <td class="usd num">${fmtU(c.usd)}</td>
      <td class="usd num">${fmtU(c.kv)}</td>
      <!-- AJUSTE: input editable por referencia (solo Admin/Finanzas) -->
      <td class="usd" style="padding:0;min-width:100px">
        ${edit
          ? `<input class="ci" type="number" step="0.5" value="${ajuste}"
               style="width:100%;background:#EBF4FF;font-weight:600"
               title="Ajuste USD — se SUMA al KV Markup para bajar el precio"
               onchange="updateTelaField('${tId}','ajuste',this.value)">`
          : `<span class="cell-ro">${ajuste}</span>`}
      </td>
      <!-- MARGEN: input editable por referencia -->
      <td class="usd" style="padding:0;min-width:100px">
        ${edit
          ? `<input class="ci" type="number" step="1" value="${margen}"
               style="width:100%;background:#EBF4FF;font-weight:600"
               title="Margen Extra USD fijo por referencia"
               onchange="updateTelaField('${tId}','margen',this.value)">`
          : `<span class="cell-ro">${margen}</span>`}
      </td>
      <!-- Exportación -->
      <td class="num" style="font-family:var(--mono);font-size:11px">${fmtU(c.expA)}</td>
      <td class="num" style="font-family:var(--mono);font-size:11px">${fmtU(c.araA)}</td>
      <td class="usd sub num">${fmtU(c.sub5)}</td>
      <!-- Logística -->
      <td class="num" style="font-family:var(--mono);font-size:11px">${fmtU(c.amerA)}</td>
      <td class="num" style="font-family:var(--mono);font-size:11px">${fmtU(c.factA)}</td>
      <td class="num" style="font-family:var(--mono);font-size:11px">${fmtU(c.t11)}</td>
      <!-- Precios finales -->
      <td class="grn sub num" style="font-weight:700">${fmtU(c.ws)}</td>
      <td class="usd num">${fmtU(c.rt)}</td>
      <td class="fin num" style="font-weight:700">${fmtU(c.rt)}</td>
      <!-- Precio SAS COP = WS USD × TRM -->
      <td style="text-align:right;font-family:var(--mono);font-size:11px;
                 background:#FFF9C4;font-weight:600">
        $${fmt(c.cop)}
      </td>
      <!-- Precio Retail COP = RT USD × TRM -->
      <td style="text-align:right;font-family:var(--mono);font-weight:700;
                 font-size:11px;background:#FFB74D;color:#3E1500">
        $${fmt(c.rtCop)}
      </td>
    </tr>`).join('');

  // Actualizar los KPIs del resumen
  updateMetrics(rows.map(r => r.c));
}


/**
 * Actualiza las 4 métricas de resumen del Consolidado.
 * @param {Array} cs - Array de resultados calcRow()
 */
function updateMetrics(cs) {
  const n  = cs.length;
  const el = id => document.getElementById(id);
  if (!el('m-refs')) return;

  el('m-refs').textContent = n;
  el('m-cop').textContent  = n ? '$ '   + fmt(cs.reduce((s,c) => s + c.sub2, 0) / n) : '$ 0';
  el('m-ws').textContent   = n ? 'USD ' + fmtU(cs.reduce((s,c) => s + c.ws,   0) / n) : 'USD 0';
  el('m-rt').textContent   = n ? 'USD ' + fmtU(cs.reduce((s,c) => s + c.rt,   0) / n) : 'USD 0';
}


/**
 * Muestra u oculta el panel de parámetros globales.
 */
function toggleParams() {
  const b = document.getElementById('params-body');
  if (b) b.style.display = b.style.display === 'none' ? '' : 'none';
}


/**
 * Sincroniza el TRM entre la topbar y el panel de parámetros.
 * Se llama desde ambos inputs para mantenerlos en sincronía.
 * @param {string} v - Nuevo valor del TRM
 */
function onTrmChange(v) {
  const g = document.getElementById('g-trm');
  if (g) g.value = v;
  const p = document.getElementById('p-trm');
  if (p) p.value = v;
  recalc();
}


/**
 * Exporta el Consolidado completo a un archivo CSV.
 * Solo disponible para Admin y Finanzas (controlado desde buildUI).
 */
function exportCSV() {
  const p   = getParams();
  const hdr = 'Referencia,Mat.Prima,Insumos,Taller,Sub.TL2.COP,' +
              'WS.USD,RT.USD,Precio.SAS.COP,Precio.Retail.COP\n';

  const rows = TELAS.map(t => {
    const c = calcRow(t, INSUMOS.find(i => i.ref === t.ref), p);
    return `"${t.ref}",${Math.round(c.mat)},${Math.round(c.ins)},` +
           `${Math.round(c.tal)},${Math.round(c.sub2)},` +
           `${Math.round(c.ws)},${Math.round(c.rt)},` +
           `${Math.round(c.cop)},${Math.round(c.rtCop)}`;
  }).join('\n');

  // BOM UTF-8 para que Excel abra correctamente los caracteres especiales
  const blob = new Blob(['\ufeff' + hdr + rows], {
    type: 'text/csv;charset=utf-8'
  });
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'KV_Costeo_PF-FW26.csv';
  a.click();

  addHist('Exportó CSV del Consolidado', 'Consolidado');
  toast('✓ CSV exportado');
}


// ── SELECTOR DE COLECCIÓN ────────────────────────────────────

/**
 * Rellena el <select> con las colecciones disponibles en COLECCIONES[].
 * Se llama automáticamente al activar el tab de Consolidado
 * y cada vez que cargarDesdeDB termina de cargar.
 */
function poblarSelectorColecciones() {
  const sel = document.getElementById('sel-coleccion');
  if (!sel) return;

  // Guardar la selección actual para no perderla al repoblar
  const actual = sel.value;

  sel.innerHTML = '<option value="">— Todas las colecciones —</option>' +
    COLECCIONES.map(c =>
      `<option value="${c.id}" ${String(c.id) === String(actual) ? 'selected' : ''}>
         ${esc(c.name)} · ${c.season} ${c.year}
       </option>`
    ).join('');
}

/**
 * Guarda la colección elegida en el selector (sin recargar aún).
 * El botón ▶ Cargar es quien dispara la carga real.
 */
function onColeccionChange(val) {
  const estado = document.getElementById('col-estado');
  if (estado) estado.textContent = val ? '(sin cargar aún — presiona ▶ Cargar)' : '';
}

/**
 * Lee la colección seleccionada en el dropdown y carga
 * solo las referencias de esa colección desde la BD.
 * Si no hay selección, carga todas.
 */
async function cargarColeccionSeleccionada() {
  const sel    = document.getElementById('sel-coleccion');
  const estado = document.getElementById('col-estado');
  const colId  = sel ? sel.value : '';
  const colNombre = sel?.options[sel.selectedIndex]?.text || '';

  if (estado) {
    estado.textContent = '⏳ Cargando...';
    estado.style.color = 'var(--tx3)';
  }

  await cargarDesdeDB(colId || null);

  if (estado) {
    estado.textContent = colId
      ? `✓ ${TELAS.length} referencia(s) de "${colNombre.split('·')[0].trim()}"`
      : `✓ ${TELAS.length} referencia(s) en total`;
    estado.style.color = 'var(--g1)';
  }

  addHist(
    'Cargó colección en Consolidado',
    'Consolidado',
    colId ? colNombre : 'Todas'
  );
}
