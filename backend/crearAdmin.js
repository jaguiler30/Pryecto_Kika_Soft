require('dotenv').config();
const bcrypt = require('bcrypt');
const db     = require('./src/config/db');

// ─── Datos del usuario administrador ─────────────────
const ADMIN = {
    Nombre:    'Administrador',
    Email:     'admin@kika.com',
    Password:  'Admin1234',   // ← cambia esto antes de ejecutar
    ROL_idROL: 4,             // 4 = Administrador
};
// ──────────────────────────────────────────────────────

async function crearAdmin() {
    try {
        console.log('🔐 Encriptando contraseña...');
        const hash = await bcrypt.hash(ADMIN.Password, 10);

        // Insertar roles si no existen
        console.log('📋 Verificando roles...');
        await db.execute(`
            INSERT IGNORE INTO ROL (idROL, Nombre, Descripcion) VALUES
            (1, 'Materia Prima',  'Gestión de telas e insumos'),
            (2, 'Costeo',        'Conformación de precios'),
            (3, 'Consulta',      'Solo lectura de costos'),
            (4, 'Administrador', 'Acceso total al sistema')
        `);

        // Verificar si ya existe un admin
        const existe = await db.query(
            'SELECT idUSUARIO FROM USUARIO WHERE Email = ?',
            [ADMIN.Email]
        );

        if (existe.length > 0) {
            console.log('⚠️  Ya existe un usuario con ese email.');
            console.log('   Actualizando contraseña...');
            await db.execute(
                'UPDATE USUARIO SET Password = ? WHERE Email = ?',
                [hash, ADMIN.Email]
            );
            console.log('✅ Contraseña actualizada correctamente.');
        } else {
            await db.execute(`
                INSERT INTO USUARIO (Nombre, Email, Password, Activo, ROL_idROL)
                VALUES (?, ?, ?, 1, ?)
            `, [ADMIN.Nombre, ADMIN.Email, hash, ADMIN.ROL_idROL]);
            console.log('✅ Usuario administrador creado correctamente.');
        }

        console.log('─────────────────────────────────────');
        console.log('📧 Email:     ', ADMIN.Email);
        console.log('🔑 Password:  ', ADMIN.Password);
        console.log('👤 Rol:        Administrador');
        console.log('─────────────────────────────────────');
        console.log('¡Listo! Ya puedes iniciar sesión.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

crearAdmin();
