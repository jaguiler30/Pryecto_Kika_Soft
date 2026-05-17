const mysql = require('mysql2/promise');

class Database {
    constructor() {
        this.pool = mysql.createPool({
            host:     process.env.DB_HOST     || 'localhost',
            user:     process.env.DB_USER     || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME     || 'produccion_prendas',
            port:     process.env.DB_PORT     || 3306,
            waitForConnections: true,
            connectionLimit:    10,
        });
    }

    // Ejecuta una query y devuelve las filas
    async query(sql, params = []) {
        const [rows] = await this.pool.execute(sql, params);
        return rows;
    }

    // Ejecuta INSERT/UPDATE/DELETE y devuelve el resultado completo
    async execute(sql, params = []) {
        const [result] = await this.pool.execute(sql, params);
        return result;
    }

    // Obtiene una conexión del pool (necesaria para transacciones)
    async getConnection() {
        return await this.pool.getConnection();
    }
}

// Singleton — una sola instancia en toda la app
module.exports = new Database();