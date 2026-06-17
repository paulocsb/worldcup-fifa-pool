-- ============================================================================
-- 002_seed_teams: 48 seleções FIFA 2026 + grupos (sorteio de 05/12/2025)
-- ids são placeholders sequenciais; quando integrarmos com API-Football,
-- atualizar pelos fixture team ids reais via UPSERT (id é PK; nome é único).
-- ============================================================================

insert into public.teams (id, name, code, group_letter, flag_url) values
  -- Grupo A
  (101, 'México',          'MEX', 'A', 'https://flagcdn.com/mx.svg'),
  (102, 'Coreia do Sul',   'KOR', 'A', 'https://flagcdn.com/kr.svg'),
  (103, 'África do Sul',   'RSA', 'A', 'https://flagcdn.com/za.svg'),
  (104, 'Tchéquia',        'CZE', 'A', 'https://flagcdn.com/cz.svg'),

  -- Grupo B
  (105, 'Canadá',                'CAN', 'B', 'https://flagcdn.com/ca.svg'),
  (106, 'Suíça',                 'SUI', 'B', 'https://flagcdn.com/ch.svg'),
  (107, 'Catar',                 'QAT', 'B', 'https://flagcdn.com/qa.svg'),
  (108, 'Bósnia e Herzegovina',  'BIH', 'B', 'https://flagcdn.com/ba.svg'),

  -- Grupo C
  (109, 'Brasil',     'BRA', 'C', 'https://flagcdn.com/br.svg'),
  (110, 'Marrocos',   'MAR', 'C', 'https://flagcdn.com/ma.svg'),
  (111, 'Escócia',    'SCO', 'C', 'https://flagcdn.com/gb-sct.svg'),
  (112, 'Haiti',      'HAI', 'C', 'https://flagcdn.com/ht.svg'),

  -- Grupo D
  (113, 'Estados Unidos', 'USA', 'D', 'https://flagcdn.com/us.svg'),
  (114, 'Paraguai',       'PAR', 'D', 'https://flagcdn.com/py.svg'),
  (115, 'Turquia',        'TUR', 'D', 'https://flagcdn.com/tr.svg'),
  (116, 'Austrália',      'AUS', 'D', 'https://flagcdn.com/au.svg'),

  -- Grupo E
  (117, 'Alemanha',         'GER', 'E', 'https://flagcdn.com/de.svg'),
  (118, 'Equador',          'ECU', 'E', 'https://flagcdn.com/ec.svg'),
  (119, 'Costa do Marfim',  'CIV', 'E', 'https://flagcdn.com/ci.svg'),
  (120, 'Curaçao',          'CUW', 'E', 'https://flagcdn.com/cw.svg'),

  -- Grupo F
  (121, 'Holanda',  'NED', 'F', 'https://flagcdn.com/nl.svg'),
  (122, 'Japão',    'JPN', 'F', 'https://flagcdn.com/jp.svg'),
  (123, 'Suécia',   'SWE', 'F', 'https://flagcdn.com/se.svg'),
  (124, 'Tunísia',  'TUN', 'F', 'https://flagcdn.com/tn.svg'),

  -- Grupo G
  (125, 'Bélgica',         'BEL', 'G', 'https://flagcdn.com/be.svg'),
  (126, 'Egito',           'EGY', 'G', 'https://flagcdn.com/eg.svg'),
  (127, 'Irã',             'IRN', 'G', 'https://flagcdn.com/ir.svg'),
  (128, 'Nova Zelândia',   'NZL', 'G', 'https://flagcdn.com/nz.svg'),

  -- Grupo H
  (129, 'Espanha',          'ESP', 'H', 'https://flagcdn.com/es.svg'),
  (130, 'Uruguai',          'URU', 'H', 'https://flagcdn.com/uy.svg'),
  (131, 'Arábia Saudita',   'KSA', 'H', 'https://flagcdn.com/sa.svg'),
  (132, 'Cabo Verde',       'CPV', 'H', 'https://flagcdn.com/cv.svg'),

  -- Grupo I
  (133, 'França',   'FRA', 'I', 'https://flagcdn.com/fr.svg'),
  (134, 'Senegal',  'SEN', 'I', 'https://flagcdn.com/sn.svg'),
  (135, 'Noruega',  'NOR', 'I', 'https://flagcdn.com/no.svg'),
  (136, 'Iraque',   'IRQ', 'I', 'https://flagcdn.com/iq.svg'),

  -- Grupo J
  (137, 'Argentina',  'ARG', 'J', 'https://flagcdn.com/ar.svg'),
  (138, 'Áustria',    'AUT', 'J', 'https://flagcdn.com/at.svg'),
  (139, 'Argélia',    'ALG', 'J', 'https://flagcdn.com/dz.svg'),
  (140, 'Jordânia',   'JOR', 'J', 'https://flagcdn.com/jo.svg'),

  -- Grupo K
  (141, 'Portugal',     'POR', 'K', 'https://flagcdn.com/pt.svg'),
  (142, 'Colômbia',     'COL', 'K', 'https://flagcdn.com/co.svg'),
  (143, 'Uzbequistão',  'UZB', 'K', 'https://flagcdn.com/uz.svg'),
  (144, 'RD Congo',     'COD', 'K', 'https://flagcdn.com/cd.svg'),

  -- Grupo L
  (145, 'Inglaterra',  'ENG', 'L', 'https://flagcdn.com/gb-eng.svg'),
  (146, 'Croácia',     'CRO', 'L', 'https://flagcdn.com/hr.svg'),
  (147, 'Gana',        'GHA', 'L', 'https://flagcdn.com/gh.svg'),
  (148, 'Panamá',      'PAN', 'L', 'https://flagcdn.com/pa.svg')
;
