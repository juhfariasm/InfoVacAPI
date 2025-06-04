const express = require('express');
const router = express.Router();
const ubsController = require('../controllers/ubsController');

// Listar todas as UBS
router.get('/', ubsController.listarUBS);

// Buscar UBS por ID
router.get('/:id', ubsController.buscarUBS);

// Listar vacinas de uma UBS específica
router.get('/:id/vacinas', ubsController.listarVacinasUBS);

// Atualizar status de uma vacina em uma UBS
router.put('/:id/vacinas/:vacinaId', ubsController.atualizarStatusVacina);

// Buscar histórico de atualizações de uma UBS
router.get('/:id/historico', ubsController.buscarHistoricoAtualizacoes);

module.exports = router; 