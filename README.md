# Backend InfoVac

Este é o backend do sistema InfoVac, responsável por gerenciar as informações de vacinas e UBSs.

## Tecnologias Utilizadas

- Node.js
- Express.js
- MySQL
- Sequelize (ORM)
- JWT para autenticação
- CORS para segurança

## Estrutura do Projeto

```
backend/
├── src/
│   ├── config/         # Configurações do banco de dados e outras configurações
│   ├── controllers/    # Controladores das rotas
│   ├── middlewares/    # Middlewares (autenticação, etc)
│   ├── models/         # Modelos do Sequelize
│   ├── routes/         # Definição das rotas
│   └── app.js          # Arquivo principal da aplicação
├── .env                # Variáveis de ambiente
└── package.json        # Dependências e scripts
```

## Configuração do Ambiente

1. Instale as dependências:
```bash
npm install
```

2. Configure o arquivo `.env`:
```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=infovac
JWT_SECRET=seu_secret_jwt
PORT=5000
```

3. Inicie o servidor:
```bash
npm start
```

## Rotas da API

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de novo usuário

### UBS
- `GET /api/ubs` - Lista todas as UBSs
- `GET /api/ubs/:id` - Obtém detalhes de uma UBS específica
- `GET /api/ubs/:id/vacinas` - Lista vacinas de uma UBS
- `PUT /api/ubs/:id/vacinas/:vacinaId` - Atualiza status de uma vacina
- `GET /api/ubs/:id/historico` - Obtém histórico de alterações

### Vacinas
- `GET /api/vacinas` - Lista todas as vacinas cadastradas
- `GET /api/vacinas/:id` - Obtém detalhes de uma vacina

## Modelos de Dados

### UBS
```javascript
{
  id: number,
  nome: string,
  endereco: string,
  telefone: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Vacina
```javascript
{
  id: number,
  nome: string,
  descricao: string,
  createdAt: Date,
  updatedAt: Date
}
```

### DisponibilidadeVacina
```javascript
{
  id: number,
  id_ubs: number,
  id_vacina: number,
  status: 'Disponível' | 'Indisponível',
  cpf_funcionario: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Segurança

- Todas as rotas (exceto login/registro) requerem autenticação via JWT
- CORS configurado para permitir apenas requisições do frontend
- Validação de dados em todas as rotas
- Sanitização de inputs para prevenir SQL injection

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request