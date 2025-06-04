const pool = require('../config/db');

const ubsController = {
  // Listar todas as UBS com status calculado
  listarUBS: async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          nome,
          CONCAT(rua, ', ', numero, ' - ', bairro, ' - ', cidade, '/', estado, ' - ', cep) as endereco,
          hora_abertura,
          hora_fechamento,
          CASE 
            WHEN CURRENT_TIME BETWEEN '07:00:00' AND '18:00:00' THEN 'aberto'
            ELSE 'fechado'
          END as status
        FROM ubs 
        ORDER BY nome
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao listar UBS:', error);
      res.status(500).json({ error: 'Erro ao listar UBS' });
    }
  },

  // Buscar UBS por ID
  buscarUBS: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(`
        SELECT 
          id,
          nome,
          CONCAT(rua, ', ', numero, ' - ', bairro, ' - ', cidade, '/', estado, ' - ', cep) as endereco,
          hora_abertura,
          hora_fechamento,
          CASE 
            WHEN CURRENT_TIME BETWEEN '07:00:00' AND '18:00:00' THEN 'aberto'
            ELSE 'fechado'
          END as status
        FROM ubs 
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'UBS não encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar UBS:', error);
      res.status(500).json({ error: 'Erro ao buscar UBS' });
    }
  },

  // Listar vacinas disponíveis em uma UBS específica
  listarVacinasUBS: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(`
        SELECT 
          v.id,
          v.nome,
          dv.status
        FROM vacinas v
        LEFT JOIN disponibilidade_vacinas dv ON v.id = dv.id_vacina AND dv.id_ubs = $1
        ORDER BY v.nome
      `, [id]);

      res.json({
        ubs_id: id,
        vacinas: result.rows
      });
    } catch (error) {
      console.error('Erro ao listar vacinas da UBS:', error);
      res.status(500).json({ error: 'Erro ao listar vacinas da UBS' });
    }
  },

  // Atualizar status de uma vacina em uma UBS
  atualizarStatusVacina: async (req, res) => {
    const { id, vacinaId } = req.params;
    const { status, cpf_funcionario } = req.body;

    try {
      // Primeiro verifica se a UBS existe
      const ubsResult = await pool.query('SELECT id FROM ubs WHERE id = $1', [id]);
      if (ubsResult.rows.length === 0) {
        return res.status(404).json({ error: 'UBS não encontrada' });
      }

      // Verifica se a vacina existe
      const vacinaResult = await pool.query('SELECT id FROM vacinas WHERE id = $1', [vacinaId]);
      if (vacinaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Vacina não encontrada' });
      }

      // Busca o funcionário pelo CPF
      const funcionarioResult = await pool.query('SELECT id FROM funcionarios WHERE cpf = $1', [cpf_funcionario]);
      if (funcionarioResult.rows.length === 0) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      // Busca o status atual da vacina
      const statusAtualResult = await pool.query(`
        SELECT status 
        FROM disponibilidade_vacinas 
        WHERE id_ubs = $1 AND id_vacina = $2
      `, [id, vacinaId]);

      const statusAnterior = statusAtualResult.rows.length > 0 ? statusAtualResult.rows[0].status : null;

      // Atualiza ou insere o status da vacina
      const result = await pool.query(`
        INSERT INTO disponibilidade_vacinas (id_ubs, id_vacina, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (id_ubs, id_vacina) 
        DO UPDATE SET status = $3
        RETURNING *
      `, [id, vacinaId, status]);

      // Registra a alteração no histórico
      await pool.query(`
        INSERT INTO historico_atualizacoes (
          id_funcionario,
          id_ubs,
          id_vacina,
          status_anterior,
          status_atual,
          data,
          hora
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME)
      `, [
        funcionarioResult.rows[0].id,
        id,
        vacinaId,
        statusAnterior || 'Indisponível', // Se não existir status anterior, considera como Indisponível
        status
      ]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar status da vacina:', error);
      res.status(500).json({ error: 'Erro ao atualizar status da vacina' });
    }
  },

  // Buscar histórico de atualizações de uma UBS
  buscarHistoricoAtualizacoes: async (req, res) => {
    const { id } = req.params;

    try {
      // Verifica se a UBS existe
      const ubsResult = await pool.query('SELECT id FROM ubs WHERE id = $1', [id]);
      if (ubsResult.rows.length === 0) {
        return res.status(404).json({ error: 'UBS não encontrada' });
      }

      // Busca o histórico de atualizações
      const result = await pool.query(`
        SELECT 
          ha.id,
          f.nome as nome_funcionario,
          v.nome as nome_vacina,
          ha.status_anterior,
          ha.status_atual,
          ha.data,
          ha.hora
        FROM historico_atualizacoes ha
        JOIN funcionarios f ON ha.id_funcionario = f.id
        JOIN vacinas v ON ha.id_vacina = v.id
        WHERE ha.id_ubs = $1
        ORDER BY ha.data DESC, ha.hora DESC
      `, [id]);

      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar histórico de atualizações:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico de atualizações' });
    }
  }
};

module.exports = ubsController; 