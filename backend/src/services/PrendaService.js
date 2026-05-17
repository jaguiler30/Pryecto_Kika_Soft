const PrendaModel = require('../models/PrendaModel');

class PrendaService {

    static async guardar(data) {
        const { ref, colId, taller } = data;
        if (!ref)    throw new Error('La referencia es obligatoria');
        if (!colId)  throw new Error('La colección es obligatoria');
        if (!taller && taller !== 0) throw new Error('El costo de confección es obligatorio');

        const prendaId = await PrendaModel.guardar(data);
        return PrendaModel.getById(prendaId);
    }

    static async getByColeccion(colId) {
        if (!colId) throw new Error('El id de colección es obligatorio');
        return PrendaModel.getByColeccion(colId);
    }
}

module.exports = PrendaService;