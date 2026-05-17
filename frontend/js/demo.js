/**
 * ============================================================
 * ARCHIVO: js/demo.js
 * DESCRIPCIÓN: Cargador de datos de demostración.
 * Contiene las 10 referencias reales de la colección PRE-FALL 26
 * extraídas del Excel PLANITILLA_DE_COSTOS_DE_REF_POR_COLECCION.
 * Solo disponible para el rol Administrador.
 * Depende de: utils.js, state.js, calculator.js, todos los panes
 * ============================================================
 */


/**
 * Carga los datos demo completos de la colección PRE-FALL 26.
 * Reemplaza cualquier dato existente en TELAS, INSUMOS,
 * FIJOS y COLECCIONES con los datos reales del Excel.
 * Al finalizar reconstruye todos los panes y navega a Colecciones.
 */
function loadDemo() {

  // Limpiar datos anteriores
  TELAS = []; INSUMOS = []; FIJOS = []; COLECCIONES = [];

  // ── COLECCIÓN ──────────────────────────────────────────────
  COLECCIONES.push({
    id:        ID(),
    name:      'PRE-FALL 26',
    season:    'PF',
    year:      2026,
    desc:      'Colección principal Pre-Otoño 2026',
    createdBy: currentUser?.name || 'admin',
    createdAt: now()
  });

  // ── TELAS (hoja TELA del Excel) ────────────────────────────
  // Formato: [Colección, Referencia, CostoTaller,
  //           Mat1, Prov1, Mts1, Precio1,
  //           Mat2, Prov2, Mts2, Precio2,
  //           Mat3, Prov3, Mts3, Precio3,
  //           Mat4, Prov4, Mts4, Precio4]
  const telaData = [
    ['PRE-FALL 26','ALANNA DRESS NAVY STRIPES COTTON',170000,
      'Rayas China Oscura','PINYTEX',2.75,31505,
      '','','','',  '','','','',  '','','',''],
    ['PRE-FALL 26','HANNA DRESS LIGHT GRAY WOOL',150000,
      'Dorado Venezia Comfort','Texticorp',3.3,19328,
      '','','','',  '','','','',  '','','',''],
    ['PRE-FALL 26','HANNA DRESS WHITE DOBBY COTTON',150000,
      'Algodón Dobby Blanco','Sutex',3.3,11345,
      '','','','',  '','','','',  '','','',''],
    ['PRE-FALL 26','LENA DRESS PASTEL MEADOW TAFFETA',159000,
      'Taffeta Print','DGT',2.68,16984,
      '','','','',  '','','','',  '','','',''],
    ['PRE-FALL 26','LENA DRESS BLACK TAFFETA',159000,
      'Taffeta Negra','Noveltex',2.57,12100,
      '','','','',  '','','','',  '','','',''],
    ['PRE-FALL 26','MARIONA DRESS NAVY STRIPES COTTON',160000,
      'Rayas China Oscura','PINYTEX',2.33,31505,
      'Encaje NY-China','Klauber Brothers',3.05,32952,
      '','','','',  '','','',''],
    ['PRE-FALL 26','ANJA DRESS MIDNIGHT BLOSSOM TAFFETA',160000,
      'Taffeta Print','DGT',2.26,16984,
      '','','','',  '','','','',  '','','',''],
    ['PRE-FALL 26','ANJA DRESS BLACK TAFFETA',160000,
      'Taffeta Negra','Noveltex',2.13,12100,
      '','','','',  '','','','',  '','','',''],
    ['PRE-FALL 26','ZHANG DRESS PASTEL MEADOW COTTON',160000,
      'Glace Cotton Print','TEXTAMPA',3.55,26590,
      'Glace Cotton Solid','Primatela',0.3,13500,
      '','','','',  '','','',''],
    ['PRE-FALL 26','RIA DRESS BROWN STRIPES COTTON',160000,
      'Rayas China Clara','PINYTEX',2.26,32952,
      'Glace Cotton Solid','Primatela',0.72,13500,
      '','','','',  '','','',''],
  ];

  telaData.forEach(d => {
    // Extraer los 4 grupos de material
    const m = [0, 1, 2, 3].map(i => ({
      mat:    d[3 + i * 4] || '',
      prov:   d[4 + i * 4] || '',
      mts:    d[5 + i * 4] || '',
      precio: d[6 + i * 4] || ''
    }));
    TELAS.push({
      id:     ID(),
      ref:    d[1],
      col:    d[0],
      taller: d[2],
      m,
      ajuste: 5,    // Ajuste USD por defecto
      margen: 40    // Margen extra USD por defecto
    });
  });

  // ── INSUMOS VARIABLES (hoja INSUMOS del Excel) ─────────────
  // Formato: [Referencia,
  //           Ins1, Prov1, Cant1, Precio1, ... Ins10, Prov10, Cant10, Precio10]
  // Posiciones vacías indican que la prenda no usa ese insumo.
  const E = ['', '', '', '']; // Shorthand para insumo vacío

  const insData = [
    ['ALANNA DRESS NAVY STRIPES COTTON',
      'Sesgo Glace Cotton Blanco','INSUMOS ARCOIRIS',4.5,1050,
      'Perla mediana','Surtiemsambles',6,701,
      'Sobre para botón','Marquillas y Accesorios',1,1138,
      'Tensores 8mm','Auratex',4,74,
      'Cremallera invis. 50','YKK',1,2127,
      'Plisado','EP Plisados',1,35000,
      'Sesgo Tela base','INSUMOS ARCOIRIS',1.5,1050,
      ...E, ...E, ...E],

    ['HANNA DRESS LIGHT GRAY WOOL',
      'Perla mediana','Surtiemsambles',2,701,
      'Sobre para botón','Marquillas y Accesorios',1,1138,
      'Letin Pequeño','Cavicueros',3.5,16788,
      'Cremallera invis. 60','YKK',1,2234,
      ...E, ...E, ...E, ...E, ...E, ...E],

    ['HANNA DRESS WHITE DOBBY COTTON',
      'Perla mediana','Surtiemsambles',2,701,
      'Sobre para botón','Marquillas y Accesorios',1,1138,
      'Letin Pequeño','Cavicueros',3.5,16788,
      'Cremallera invis. 60','YKK',1,2234,
      ...E, ...E, ...E, ...E, ...E, ...E],

    ['LENA DRESS PASTEL MEADOW TAFFETA',
      'Sesgo Tela','INSUMOS ARCOIRIS',1.1,1050,
      'Sesgo Glace Cotton Navy','INSUMOS ARCOIRIS',1,1050,
      'Gafete','La Real',1,167,
      'Entretela Delgada 2669','Interflex',0.44,3600,
      'Cremallera invis. 60','YKK',1,2234,
      'Tensores 8mm','Auratex',4,74,
      ...E, ...E, ...E, ...E],

    ['LENA DRESS BLACK TAFFETA',
      'Sesgo Tela','INSUMOS ARCOIRIS',1.1,1050,
      'Gafete','La Real',1,167,
      'Entretela Delgada 2669','Interflex',0.44,3600,
      'Cremallera invis. 60','YKK',1,2234,
      'Tensores 8mm','Auratex',4,74,
      ...E, ...E, ...E, ...E, ...E],

    ['MARIONA DRESS NAVY STRIPES COTTON',
      'Sesgo Tela','INSUMOS ARCOIRIS',3,1050,
      'Sesgo Cotton Satin Negro','INSUMOS ARCOIRIS',2.5,1050,
      'Encaje Meritt II Negro','Protela',0.7,990,
      'Cremallera invis. 60','YKK',1,2234,
      'Tensores 8mm','Auratex',4,74,
      ...E, ...E, ...E, ...E, ...E],

    ['ANJA DRESS MIDNIGHT BLOSSOM TAFFETA',
      'Sesgo Tela','INSUMOS ARCOIRIS',3,1050,
      'Cremallera invis. 60','YKK',1,2234,
      ...E, ...E, ...E, ...E, ...E, ...E, ...E, ...E],

    ['ANJA DRESS BLACK TAFFETA',
      'Sesgo Tela','INSUMOS ARCOIRIS',3,1050,
      'Cremallera invis. 60','YKK',1,2234,
      ...E, ...E, ...E, ...E, ...E, ...E, ...E, ...E],

    ['ZHANG DRESS PASTEL MEADOW COTTON',
      'Entretela Delgada 2669','Interflex',0.8,3600,
      'Caucho Liviano 1cm','La Real',0.8,445,
      'Letin Pequeño','Cavicueros',1.5,16788,
      'Cremallera invis. 50','YKK',1,2127,
      ...E, ...E, ...E, ...E, ...E, ...E],

    ['RIA DRESS BROWN STRIPES COTTON',
      'Entretela Gruesa','Interflex',0.72,4620,
      'Entretela Delgada 2669','Interflex',0.72,3600,
      'Sesgo Tela','INSUMOS ARCOIRIS',2.5,1050,
      'Sesgo Glace Cotton Navy','INSUMOS ARCOIRIS',4,1050,
      'Hilo Caucho','La Real',1,300,
      'Alma','INSUMOS ARCOIRIS',2,210,
      'Boton Patena Camisero','Induboton',3,103,
      'Sobre para botón','Marquillas y Accesorios',1,1138,
      ...E, ...E],
  ];

  insData.forEach(d => {
    // Extraer los 10 grupos de insumo variable
    const ins = [0,1,2,3,4,5,6,7,8,9].map(i => ({
      name:   d[1 + i * 4] || '',
      prov:   d[2 + i * 4] || '',
      cant:   d[3 + i * 4] || '',
      precio: d[4 + i * 4] || ''
    }));
    INSUMOS.push({ id: ID(), ref: d[0], ins });
  });

  // ── INSUMOS FIJOS (hoja INSUMOS FIJOS del Excel) ───────────
  // Los 7 insumos fijos estándar de la marca KV
  seedFijos();

  // Registrar en historial
  addHist('Cargó datos demo PRE-FALL 26', 'Sistema', '10 referencias');

  // ── RECONSTRUIR TODOS LOS PANES ────────────────────────────
  // Es necesario reconstruir para que cada pane muestre los
  // datos nuevos con los permisos del usuario actual.
  buildPaneColecciones();
  buildPaneTelas();
  buildPaneInsumos();
  buildPaneConsolidado();
  buildPaneCanales();
  buildPaneConsulta();
  buildPaneHistorial();

  // Navegar a Colecciones después de que el DOM esté listo
  setTimeout(() => {
    const btn = document.getElementById('tab-colecciones');
    if (btn) goTab('colecciones', btn);
    toast('✓ Demo PRE-FALL 26 cargado — 10 referencias, 7 insumos fijos');
  }, 30);
}
