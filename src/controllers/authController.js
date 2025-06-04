const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  // Registro de novo usuário
  register: async (req, res) => {
    const { nome, email, senha, cpf, tipo_usuario } = req.body;
    
    try {
      // Verificar se o usuário já existe
      const userExists = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1 OR cpf = $2',
        [email, cpf]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'Usuário já existe' });
      }

      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      // Inserir novo usuário
      const result = await pool.query(
        'INSERT INTO usuarios (nome, email, senha, cpf, tipo_usuario) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [nome, email, hashedPassword, cpf, tipo_usuario]
      );

      // Gerar token JWT
      const token = jwt.sign(
        { id: result.rows[0].id, tipo_usuario: result.rows[0].tipo_usuario },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        token,
        user: {
          id: result.rows[0].id,
          nome: result.rows[0].nome,
          email: result.rows[0].email,
          tipo_usuario: result.rows[0].tipo_usuario
        }
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  },

  // Login de usuário
  login: async (req, res) => {
    const { cpf, senha } = req.body;

    try {
      // Busca o funcionário no banco, limpando o CPF antes da comparação
      const funcionarioResult = await pool.query(
        `SELECT f.*, ubs.nome as nome_ubs 
         FROM funcionarios f 
         LEFT JOIN ubs ON f.id_ubs = ubs.id 
         WHERE REGEXP_REPLACE(f.cpf, '[^0-9]', '', 'g') = $1`,
        [cpf]
      );

      // Se não encontrou o funcionário
      if (funcionarioResult.rows.length === 0) {
        return res.status(401).json({ error: 'CPF ou senha incorretos' });
      }

      const funcionario = funcionarioResult.rows[0];

      // Verifica a senha baseado no tipo de acesso
      if (funcionario.primeiro_acesso) {
        // Se for primeiro acesso, compara diretamente
        if (senha !== funcionario.senha) {
          return res.status(401).json({ error: 'CPF ou senha incorretos' });
        }
      } else {
        // Se não for primeiro acesso, compara usando bcrypt
        const senhaValida = await bcrypt.compare(senha, funcionario.senha);
        if (!senhaValida) {
          return res.status(401).json({ error: 'CPF ou senha incorretos' });
        }
      }

      // Retorna os dados do funcionário
      res.json({
        primeiro_acesso: funcionario.primeiro_acesso,
        user: {
          cpf: funcionario.cpf,
          nome: funcionario.nome,
          id_ubs: funcionario.id_ubs,
          nome_ubs: funcionario.nome_ubs
        }
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  // Alterar senha
  alterarSenha: async (req, res) => {
    const { cpf, nova_senha } = req.body;

    try {
      // Verifica se o CPF foi fornecido
      if (!cpf) {
        return res.status(400).json({ error: 'CPF não fornecido' });
      }

      // Verifica se a nova senha foi fornecida
      if (!nova_senha) {
        return res.status(400).json({ error: 'Nova senha não fornecida' });
      }

      // Verifica se a senha tem pelo menos 6 caracteres
      if (nova_senha.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }

      // Busca o funcionário
      const funcionarioResult = await pool.query(
        'SELECT * FROM funcionarios WHERE cpf = $1',
        [cpf]
      );

      if (funcionarioResult.rows.length === 0) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      // Gera o hash da nova senha
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(nova_senha, salt);

      // Atualiza a senha (agora com hash) e marca que não é mais primeiro acesso
      const updateResult = await pool.query(
        'UPDATE funcionarios SET senha = $1, primeiro_acesso = false WHERE cpf = $2 RETURNING *',
        [senhaHash, cpf]
      );

      if (updateResult.rows.length === 0) {
        return res.status(500).json({ error: 'Erro ao atualizar a senha' });
      }

      res.json({ 
        message: 'Senha alterada com sucesso',
        primeiro_acesso: false
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  }
};

module.exports = authController; 