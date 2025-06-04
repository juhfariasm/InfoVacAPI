-- Inserir UBSs de Demerval Lobão
INSERT INTO ubs (nome, rua, numero, bairro, cidade, estado, cep, hora_abertura, hora_fechamento)
VALUES 
('UBS Centro de Demerval Lobão', 'Rua Principal', '123', 'Centro', 'Demerval Lobão', 'Piauí', '64390-000', '07:00:00', '18:00:00'),
('UBS Bairro Novo', 'Av. Nova', '456', 'Bairro Novo', 'Demerval Lobão', 'Piauí', '64390-001', '07:00:00', '18:00:00'),
('UBS Vila Progresso', 'Rua Progresso', '789', 'Vila Progresso', 'Demerval Lobão', 'Piauí', '64390-002', '07:00:00', '18:00:00');

-- Inserir disponibilidade de vacinas para as UBSs de Demerval Lobão
INSERT INTO disponibilidade_vacinas (id_ubs, id_vacina, status)
SELECT 
    u.id as id_ubs,
    v.id as id_vacina,
    'Disponível' as status
FROM ubs u
CROSS JOIN vacinas v
WHERE u.cidade = 'Demerval Lobão'
AND v.nome IN ('COVID-19', 'Gripe', 'Febre Amarela', 'Tétano', 'Hepatite B', 'Sarampo'); 