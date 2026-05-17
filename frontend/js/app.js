/**
 * js/app.js — Inicialización del módulo de Costeo (versión Kika integrada)
 * Se carga ÚLTIMO. No gestiona login/logout (eso es de Kika).
 * Incluye: carga Excel, drag-and-drop, navegación teclado estilo Excel.
 */


// ── CARGA DE ARCHIVOS EXCEL ─────────────────────────────────

function handleDrop(e, tab) {
  e.preventDefault();
  document.getElementById('drop-' + tab)?.classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file) readExcelFile(file, tab);
}

function handleFile(input, tab) {
  const file = input.files[0];
  if (file) readExcelFile(file, tab);
  input.value = '';
}

function readExcelFile(file, tab) {
  const statusEl = document.getElementById('upload-status-' + tab);
  if (statusEl) {
    statusEl.textContent = '⏳ Leyendo fichero…';
    statusEl.style.color = 'var(--tx3)';
  }

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });

      // ── Hoja TELA ──────────────────────────────────────────
      const sheetTela = wb.SheetNames.find(n => /^tela/i.test(n.trim()))
                     || wb.SheetNames[0];
      if (wb.Sheets[sheetTela]) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetTela], { header: 1, defval: '' });
        importTelasRows(rows, sheetTela, tab === 'telas' ? statusEl : null);
      }

      // ── Hoja INSUMOS variables ─────────────────────────────
      const sheetIns = wb.SheetNames.find(n => /^insumos?$/i.test(n.trim()))
                    || wb.SheetNames.find(n => /insumo/i.test(n) && !/fijo/i.test(n));
      if (sheetIns && wb.Sheets[sheetIns]) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetIns], { header: 1, defval: '' });
        importInsumosRows(rows, sheetIns, tab === 'insumos' ? statusEl : null);
      }

      // ── Hoja INSUMOS FIJOS ─────────────────────────────────
      const sheetFijos = wb.SheetNames.find(n => /fijo/i.test(n));
      if (sheetFijos && wb.Sheets[sheetFijos]) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetFijos], { header: 1, defval: '' });
        importFijosRows(rows, sheetFijos);
      }

      const hojasCargadas = [sheetTela, sheetIns, sheetFijos].filter(Boolean).length;
      toast(`✓ ${hojasCargadas} hoja(s) importadas del Excel`);

    } catch (err) {
      if (statusEl) {
        statusEl.textContent = '❌ Error al leer el fichero: ' + err.message;
        statusEl.style.color = 'var(--red)';
      }
    }
  };
  reader.readAsArrayBuffer(file);
}


// ── IMPORTAR INSUMOS FIJOS DESDE EXCEL ──────────────────────

function importFijosRows(rows, sheetName) {
  // Formato HORIZONTAL: Nombre | Cantidad | Precio  (repetido por cada fijo)
  // Todos los datos están en la fila 2 (índice 1), la fila 1 son encabezados
  const dataRow = rows[1];
  if (!dataRow) return;

  FIJOS = [];
  let added = 0;

  for (let i = 0; i + 2 < dataRow.length; i += 3) {
    const name   = String(dataRow[i]     || '').trim();
    const qty    = parseFloat(dataRow[i + 1]) || 1;
    const precio = parseFloat(dataRow[i + 2]) || 0;
    if (!name) break;
    FIJOS.push({ id: ID(), name, precio, qty });
    added++;
  }

  if (added) {
    renderFijosModal();
    renderFijosSummary();
    recalc();
  }
}


// ── NAVEGACIÓN TECLADO ESTILO EXCEL ─────────────────────────

document.addEventListener('keydown', e => {
  const el = e.target;
  if (el.tagName !== 'INPUT' || e.key !== 'Enter') return;
  if (!el.classList.contains('ci') && !el.closest('.xgrid')) return;
  e.preventDefault();
  const allInputs = Array.from(
    document.querySelectorAll('input.ci:not([readonly]):not([disabled])')
  );
  const idx = allInputs.indexOf(el);
  if (idx >= 0 && idx < allInputs.length - 1) {
    allInputs[idx + 1].focus();
    allInputs[idx + 1].select?.();
  }
});


// ── CARGA INICIAL DESDE BASE DE DATOS ───────────────────────
// Se llama automáticamente al iniciar el módulo (desde buildUI en auth.js).
// Puebla TELAS, INSUMOS y FIJOS desde la BD para que todos los roles
// (incluyendo el Financiero / Rol 2) vean los datos al entrar.

async function cargarDesdeDB(colId = null) {
  const api   = window.parent?.API_URL || 'http://localhost:3000/api';
  const token = window.parent?.kikaToken || sessionStorage.getItem('kika_token');
  if (!token) return;

  try {
    // ── 0. Cargar COLECCIONES siempre frescos desde la BD ──────
    // El Financiero (Rol 2) no tiene el tab de Colecciones, así que
    // COLECCIONES nunca se llena por esa vía. Lo cargamos aquí directamente.
    {
      const resCol  = await fetch(`${api}/colecciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const jsonCol = await resCol.json();
      if (jsonCol.ok && jsonCol.data) {
        COLECCIONES = jsonCol.data.map(c => ({
          id:        c.idCOLECCION,
          name:      c.NombreColeccion,
          season:    c.Temporada,
          year:      c.Año,
          createdAt: c.createdAt || '',
          totalRefs: c.totalReferencias || 0
        }));

        // Poblar selectores inmediatamente después de tener las colecciones
        poblarSelectorColecciones?.();
        poblarSelectorConsulta?.();
        renderColecciones?.();
      }
    }

    // ── 1. Cargar referencias (TELAS + INSUMOS) ──────────────
    // Si se pasa colId, filtra solo esa colección
    const url = colId
      ? `${api}/prendas/para-frontend?colId=${colId}`
      : `${api}/prendas/para-frontend`;

    const resPrendas = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const jsonPrendas = await resPrendas.json();

    if (jsonPrendas.ok && jsonPrendas.data) {
      // Siempre reemplazar con los datos de BD
      TELAS   = jsonPrendas.data.telas;
      INSUMOS = jsonPrendas.data.insumos;
    }

    // ── 2. Cargar insumos fijos globales ─────────────────────
    const resFijos = await fetch(`${api}/prendas/insumos-fijos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const jsonFijos = await resFijos.json();

    if (jsonFijos.ok && jsonFijos.data && jsonFijos.data.length > 0) {
      FIJOS = jsonFijos.data.map(f => ({
        id:     String(f.idINSUMOS_FIJO_GLOVALES),
        name:   f.Nombre,
        precio: f.Precio_unitari,
        qty:    f.Cantidad
      }));
      renderFijosModal?.();
      renderFijosSummary?.();
    }

    // ── 3. Re-renderizar las vistas con los datos cargados ───
    renderColecciones?.();
    renderTelas?.();
    syncInsRefs?.();
    recalc?.();
    renderConsulta?.();

    // ── 4. Re-poblar selectores con datos ya actualizados ───────────
    poblarSelectorColecciones?.();
    poblarSelectorConsulta?.();

  } catch (err) {
    console.warn('[Kika] No se pudo cargar datos desde BD:', err.message);
  }
}
