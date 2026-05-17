/**
 * ============================================================
 * ARCHIVO: js/pane-consulta.js
 * DESCRIPCIÓN: Módulo de Consulta de Referencias.
 * Permite a todos los roles buscar cualquier referencia y ver
 * su ficha técnica completa: materiales, insumos y precios.
 * Los precios solo son visibles para Admin y Finanzas.
 * Depende de: utils.js, state.js, auth.js, calculator.js
 * ============================================================
 */


/**
 * Construye el HTML del pane de Consulta.
 * Incluye buscador, grid de resultados y área de ficha técnica.
 */
function buildPaneConsulta() {
  const pane = document.getElementById('pane-consulta');
  if (!pane) return;

  pane.innerHTML = `
    <div class="page-title">🔍 Módulo de Consulta</div>
    <div class="page-sub">
      Busca cualquier referencia y consulta su ficha técnica completa.
      Los precios de venta solo son visibles para Admin y Finanzas.
    </div>

    <!-- ── SELECTOR DE COLECCIÓN ──────────────────────────── -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;
                flex-wrap:wrap">
      <label style="font-size:12px;font-weight:600;color:var(--tx2)">
        📁 Colección:
      </label>
      <select id="sel-coleccion-consulta"
        style="font-family:var(--sans);font-size:13px;padding:6px 10px;
               border:1.5px solid var(--g3);border-radius:var(--r);
               background:var(--bg);color:var(--tx1);min-width:220px;cursor:pointer"
        onchange="filtrarConsultaPorColeccion(this.value)">
        <option value="">— Todas las colecciones —</option>
      </select>
      <span id="consulta-col-estado"
        style="font-size:11px;color:var(--tx3)"></span>
    </div>

    <!-- Barra de búsqueda -->
    <div class="consulta-search">
      <input id="consulta-input" type="text"
             placeholder="Buscar por referencia o colección…"
             oninput="consultaQuery=this.value; renderConsulta()"
             autocomplete="off">
      <button class="btn btn-o"
              onclick="document.getElementById('consulta-input').value='';
                       consultaQuery=''; consultaSelected=null; renderConsulta()">
        ✕ Limpiar
      </button>
    </div>

    <!-- Grid de tarjetas de resultados (generado por renderConsulta) -->
    <div id="consulta-results" class="consulta-results"></div>

    <!-- Ficha técnica expandida al seleccionar una tarjeta -->
    <div id="consulta-ficha"></div>`;

  renderConsulta();
}


/**
 * Renderiza los resultados de búsqueda y la ficha seleccionada.
 * Se llama cada vez que el usuario escribe en el buscador o
 * selecciona una tarjeta.
 */
function renderConsulta() {
  const resultsEl = document.getElementById('consulta-results');
  const fichaEl   = document.getElementById('consulta-ficha');
  if (!resultsEl) return;

  const q = (consultaQuery || '').toLowerCase().trim();

  // Sin datos cargados
  if (!TELAS.length) {
    resultsEl.innerHTML = `
      <div style="color:var(--tx3);font-style:italic;padding:10px">
        Sin datos · carga el Demo (Admin) o un fichero Excel
      </div>`;
    fichaEl.innerHTML = '';
    return;
  }

  // Filtrar referencias según el texto de búsqueda
  const filtered = TELAS.filter(t =>
    !q ||
    t.ref.toLowerCase().includes(q) ||
    (t.col || '').toLowerCase().includes(q)
  );

  if (!filtered.length) {
    resultsEl.innerHTML = `
      <div style="color:var(--tx3);font-style:italic;padding:10px">
        Sin resultados para "${esc(consultaQuery)}"
      </div>`;
    fichaEl.innerHTML = '';
    return;
  }

  // Renderizar tarjetas de resultado
  resultsEl.innerHTML = filtered.map(t => {
    const mat  = calcTtlMat(t);
    const iRow = INSUMOS.find(i => i.ref === t.ref);
    const insV = iRow ? calcTtlVar(iRow) : 0;
    const insF = calcTtlFijos();

    return `
      <div class="ref-card ${consultaSelected === t.id ? 'selected' : ''}"
           onclick="selectConsulta('${t.id}')">
        <div class="rc-name">${esc(t.ref)}</div>
        <div class="rc-col">${esc(t.col || 'Sin colección')}</div>
        <div class="rc-stats">
          <span class="badge bg">Mat $${fmt(mat)}</span>
          <span class="badge bb">Ins $${fmt(insV + insF)}</span>
          <span class="badge ba">Taller $${fmt(t.taller)}</span>
        </div>
      </div>`;
  }).join('');

  // Mostrar ficha si hay una referencia seleccionada
  if (consultaSelected) {
    const t = TELAS.find(x => x.id === consultaSelected);
    if (t) renderFichaCompleta(t, fichaEl);
    else { fichaEl.innerHTML = ''; consultaSelected = null; }
  } else {
    fichaEl.innerHTML = `
      <div style="color:var(--tx3);font-style:italic;padding:10px 0">
        👆 Selecciona una referencia para ver su ficha completa
      </div>`;
  }
}


/**
 * Selecciona o deselecciona una referencia para ver su ficha.
 * Si se hace clic en la ya seleccionada, se cierra la ficha.
 * @param {string} id - ID de la referencia
 */
function selectConsulta(id) {
  consultaSelected = (consultaSelected === id) ? null : id;
  addHist('Consultó referencia', 'Consulta',
    TELAS.find(t => t.id === id)?.ref || id);
  renderConsulta();

  // Hacer scroll suave hasta la ficha
  if (consultaSelected)
    document.getElementById('consulta-ficha')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/**
 * Renderiza la ficha técnica completa de una referencia.
 * Muestra 5 secciones: Materiales, Confección, Insumos Fijos,
 * Resumen de Costos y Precios (estos últimos solo para Admin/Finanzas).
 * @param {Object}  t         - Fila de TELAS
 * @param {Element} container - Elemento donde insertar el HTML
 */
function renderFichaCompleta(t, container) {
  const iRow         = INSUMOS.find(i => i.ref === t.ref);
  const p            = getParams();
  const c            = calcRow(t, iRow, p);
  const col          = COLECCIONES.find(x => x.name === t.col);
  const canSeePrice  = ['admin', 'finanzas'].includes(currentUser?.role);

  // Filtrar solo materiales e insumos con datos reales
  const mats    = (t.m || []).filter(m => m.mat);
  const insVars = iRow ? (iRow.ins || []).filter(i => i.name) : [];

  container.innerHTML = `
  <div class="ficha-box">

    <!-- ENCABEZADO de la ficha -->
    <div class="ficha-header">
      <div class="fh-name">${esc(t.ref)}</div>
      <div class="fh-meta">
        📁 ${esc(t.col || 'Sin colección')}
        ${col ? ` · ${col.season} ${col.year}` : ''}
        · Creado por: ${esc(col?.createdBy || '—')}
      </div>
    </div>

    <!-- SECCIÓN 1: Materiales (hoja TELA del Excel) -->
    <div class="ficha-section">
      <h4>🧵 Materiales (Hoja TELA)</h4>
      ${mats.length
        ? `<div class="ficha-mat-grid">
             <!-- Encabezados de la mini-tabla de materiales -->
             <div class="fg-head">Material</div>
             <div class="fg-head" style="text-align:right">Mts/Cant</div>
             <div class="fg-head" style="text-align:right">$/Unid</div>
             <div class="fg-head" style="text-align:right">Total</div>
             <!-- Filas de materiales -->
             ${mats.map(m => `
               <div class="fg-cell" style="font-family:var(--sans);font-weight:500">
                 ${esc(m.mat)}<br>
                 <span style="font-size:10px;color:var(--tx3)">${esc(m.prov || '—')}</span>
               </div>
               <div class="fg-cell" style="text-align:right">${m.mts}</div>
               <div class="fg-cell" style="text-align:right">$${fmt(m.precio)}</div>
               <div class="fg-cell"
                    style="text-align:right;background:var(--gxlt);font-weight:600">
                 $${fmt(D(m.mts) * D(m.precio))}
               </div>`).join('')}
           </div>
           <div style="text-align:right;margin-top:6px;font-family:var(--mono);
                       font-weight:700;font-size:13px;color:var(--g1)">
             TTL MATERIALES: $${fmt(c.mat)}
           </div>`
        : '<div style="color:var(--tx3);font-style:italic;font-size:12px">Sin materiales registrados</div>'}
    </div>

    <!-- SECCIÓN 2: Confección e Insumos Variables (hoja INSUMOS) -->
    <div class="ficha-section">
      <h4>🪡 Confección e Insumos Variables</h4>
      <div class="ficha-row">
        <span class="fr-label">Costo Taller</span>
        <span class="fr-val">$${fmt(t.taller)}</span>
      </div>
      ${insVars.map(i => `
        <div class="ficha-row">
          <span class="fr-label">
            ${esc(i.name)}
            <span style="color:var(--tx3);font-size:10px">(${esc(i.prov || '—')})</span>
          </span>
          <span class="fr-val">
            ${i.cant} × $${fmt(i.precio)} = $${fmt(D(i.cant) * D(i.precio))}
          </span>
        </div>`).join('')}
      ${insVars.length
        ? `<div style="text-align:right;margin-top:4px;font-family:var(--mono);
                       font-weight:600;font-size:12px;color:var(--blue)">
             TTL INSUMOS VAR: $${fmt(iRow ? calcTtlVar(iRow) : 0)}
           </div>`
        : ''}
    </div>

    <!-- SECCIÓN 3: Insumos Fijos (comunes a todas las referencias) -->
    <div class="ficha-section">
      <h4>📦 Insumos Fijos (comunes a todas las referencias)</h4>
      ${FIJOS.length
        ? FIJOS.map(f => `
            <div class="ficha-row">
              <span class="fr-label">${esc(f.name)}</span>
              <span class="fr-val">
                ${f.qty} × $${fmt(f.precio)} = $${fmt(D(f.qty) * D(f.precio))}
              </span>
            </div>`).join('') +
          `<div style="text-align:right;margin-top:4px;font-family:var(--mono);
                       font-weight:600;font-size:12px;color:var(--blue)">
             TTL FIJOS: $${fmt(calcTtlFijos())}
           </div>`
        : '<div style="color:var(--tx3);font-style:italic;font-size:12px">Sin insumos fijos configurados</div>'}
    </div>

    <!-- SECCIÓN 4: Resumen de Costos de Producción -->
    <div class="ficha-section">
      <h4>📊 Resumen de Costos de Producción</h4>
      <div class="ficha-row">
        <span class="fr-label">Materiales</span>
        <span class="fr-val">$${fmt(c.mat)}</span>
      </div>
      <div class="ficha-row">
        <span class="fr-label">Insumos (var + fijos)</span>
        <span class="fr-val">$${fmt(c.ins)}</span>
      </div>
      <div class="ficha-row">
        <span class="fr-label">Costo Taller</span>
        <span class="fr-val">$${fmt(c.tal)}</span>
      </div>
      <div class="ficha-row">
        <span class="fr-label">Seguro por Prenda</span>
        <span class="fr-val">$${fmt(c.seg)}</span>
      </div>
      <!-- SUB TL 1 resaltado -->
      <div class="ficha-row" style="font-weight:700;font-size:13px">
        <span style="color:var(--g1)">SUB TL 1 — Producción COP</span>
        <span style="font-family:var(--mono);color:var(--g1)">$${fmt(c.sub1)}</span>
      </div>
      <div class="ficha-row">
        <span class="fr-label">+ Costo Financiero IVA</span>
        <span class="fr-val">$${fmt(c.finIva)}</span>
      </div>
      <div class="ficha-row">
        <span class="fr-label">+ Imprevistos</span>
        <span class="fr-val">$${fmt(c.imprev)}</span>
      </div>
      <!-- SUB TL 2 resaltado -->
      <div class="ficha-row" style="font-weight:700;font-size:13px">
        <span style="color:var(--g2)">SUB TL 2 — Costo Real COP</span>
        <span style="font-family:var(--mono);color:var(--g2)">$${fmt(c.sub2)}</span>
      </div>
    </div>

    <!-- SECCIÓN 5: Precios de Venta (SOLO Admin y Finanzas) -->
    ${canSeePrice
      ? `<div class="ficha-section">
           <h4>💲 Precios de Venta (USD / COP)</h4>
           <div class="price-band">
             <div class="price-chip" style="background:var(--bllt)">
               <div class="pc-label" style="color:var(--blue)">USD Base</div>
               <div class="pc-value" style="color:var(--blue)">${fmtU(c.usd)}</div>
             </div>
             <div class="price-chip" style="background:var(--glt)">
               <div class="pc-label" style="color:var(--g1)">WS USD ✓</div>
               <div class="pc-value" style="color:var(--g1)">${fmtU(c.ws)}</div>
             </div>
             <div class="price-chip" style="background:var(--amlt)">
               <div class="pc-label" style="color:var(--amber)">RT USD ✓</div>
               <div class="pc-value" style="color:var(--amber)">${fmtU(c.rt)}</div>
             </div>
             <div class="price-chip" style="background:#FFF9C4">
               <div class="pc-label" style="color:#7B6500">
                 Precio SAS COP<br><small>WS × TRM</small>
               </div>
               <div class="pc-value" style="color:#7B6500">$${fmt(c.cop)}</div>
             </div>
             <div class="price-chip" style="background:#FFE0B2">
               <div class="pc-label" style="color:#6D3A00">
                 Precio Retail COP<br><small>RT × TRM</small>
               </div>
               <div class="pc-value" style="color:#6D3A00">$${fmt(c.rtCop)}</div>
             </div>
           </div>
           <div style="margin-top:10px;font-size:10px;color:var(--tx3)">
             Ajuste: ${t.ajuste} USD · Margen extra: ${t.margen} USD ·
             TRM: $${fmt(p.trm)}
           </div>
         </div>`
      : `<!-- Bloqueo de precios para roles sin acceso financiero -->
         <div style="margin:0 22px 16px;background:#FFFBF0;
                     border:1px dashed var(--am2);border-radius:var(--r);padding:12px 16px">
           <div style="display:flex;align-items:center;gap:8px;color:var(--amber)">
             <span style="font-size:18px">🔒</span>
             <div>
               <div style="font-weight:700;font-size:12px">Precios de venta restringidos</div>
               <div style="font-size:11px;color:var(--tx3)">
                 Solo Administrador y Jefe de Finanzas pueden ver los precios.
               </div>
             </div>
           </div>
         </div>`}

  </div>`;
}


// ── SELECTOR DE COLECCIÓN EN CONSULTA ───────────────────────

/**
 * Rellena el selector de colecciones en el pane de Consulta.
 */
function poblarSelectorConsulta() {
  const sel = document.getElementById('sel-coleccion-consulta');
  if (!sel) return;

  const actual = sel.value;
  sel.innerHTML = '<option value="">— Todas las colecciones —</option>' +
    COLECCIONES.map(c =>
      `<option value="${c.id}" ${String(c.id) === String(actual) ? 'selected' : ''}>
         ${esc(c.name)} · ${c.season} ${c.year}
       </option>`
    ).join('');
}

/**
 * Filtra las referencias visibles en Consulta por colección.
 * Si colId está vacío, muestra todas.
 */
async function filtrarConsultaPorColeccion(colId) {
  const estado = document.getElementById('consulta-col-estado');

  if (estado) {
    estado.textContent = '⏳ Cargando...';
    estado.style.color = 'var(--tx3)';
  }

  // Limpiar selección actual y texto de búsqueda
  consultaSelected = null;
  const input = document.getElementById('consulta-input');
  if (input) { input.value = ''; consultaQuery = ''; }

  await cargarDesdeDB(colId || null);

  const sel = document.getElementById('sel-coleccion-consulta');
  const nombre = sel?.options[sel.selectedIndex]?.text || '';

  if (estado) {
    estado.textContent = colId
      ? `✓ ${TELAS.length} referencia(s)`
      : `✓ ${TELAS.length} en total`;
    estado.style.color = 'var(--g1)';
  }

  renderConsulta();
}
