-- ============================================================================
-- Restaura flag_url dos times para URLs do flagcdn.com (SVG).
--
-- Motivação: sync-fixtures estava sobrescrevendo com URLs do api-sports.io
-- que são logos/crests quadrados 150x150 — não bandeiras horizontais. Como
-- nosso TeamFlag renderiza em círculo com background-size: cover, esses logos
-- ficavam pequenos no centro com transparência ao redor.
--
-- Mapeamento manual: FIFA 3-letter code → ISO/flagcdn 2-letter code.
-- Escócia/Inglaterra usam códigos compostos (gb-sct, gb-eng).
-- ============================================================================

update public.teams t
set flag_url = 'https://flagcdn.com/' || m.flagcdn_code || '.svg'
from (values
  ('MEX','mx'), ('KOR','kr'), ('RSA','za'), ('CZE','cz'),
  ('CAN','ca'), ('SUI','ch'), ('QAT','qa'), ('BIH','ba'),
  ('BRA','br'), ('MAR','ma'), ('SCO','gb-sct'), ('HAI','ht'),
  ('USA','us'), ('PAR','py'), ('TUR','tr'), ('AUS','au'),
  ('GER','de'), ('ECU','ec'), ('CIV','ci'), ('CUW','cw'),
  ('NED','nl'), ('JPN','jp'), ('SWE','se'), ('TUN','tn'),
  ('BEL','be'), ('EGY','eg'), ('IRN','ir'), ('NZL','nz'),
  ('ESP','es'), ('URU','uy'), ('KSA','sa'), ('CPV','cv'),
  ('FRA','fr'), ('SEN','sn'), ('NOR','no'), ('IRQ','iq'),
  ('ARG','ar'), ('AUT','at'), ('ALG','dz'), ('JOR','jo'),
  ('POR','pt'), ('COL','co'), ('UZB','uz'), ('COD','cd'),
  ('ENG','gb-eng'), ('CRO','hr'), ('GHA','gh'), ('PAN','pa')
) as m(fifa_code, flagcdn_code)
where t.code = m.fifa_code;
