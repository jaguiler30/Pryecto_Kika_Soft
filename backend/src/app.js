require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const usuarioRoutes  = require('./src/routes/usuario.routes');
const coleccionRoutes = require('./src/routes/coleccionRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globales ─────────────────────────────────
app.use(cors({ origin: '*' }));          // Permite peticiones del frontend HTML
app.use(express.json());                 // Parsea body JSON
app.use(express.urlencoded({ extended: true }));

// ─── Rutas ───────────────────────────────────────────────
app.use('/api/auth',     usuarioRoutes); // POST /api/auth/login
app.use('/api/usuarios', usuarioRoutes); // GET PUT POST DELETE /api/usuarios
app.use('/api/colecciones', coleccionRoutes);

// ─── Ruta de salud ────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Servidor corriendo', timestamp: new Date() });
});

// ─── Manejo de errores global ─────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
});

// ─── Iniciar servidor ─────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
