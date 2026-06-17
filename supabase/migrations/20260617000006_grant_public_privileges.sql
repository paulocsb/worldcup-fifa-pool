-- ============================================================================
-- Concede privilégios CRUD em public.* para os roles anon / authenticated /
-- service_role. Necessário para que o supabase-js (api gateway) consiga
-- executar SELECT/INSERT/etc — RLS é o gatekeeper final por linha, mas o
-- role precisa de privilégios de tabela primeiro.
--
-- Em projetos Supabase novos isso vem por default; aqui precisamos explicitar
-- porque migrations foram criadas com `postgres` owner e o `--no-backup` em
-- restart wipou os grants implícitos.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;

grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

grant execute on all functions in schema public
  to anon, authenticated, service_role;

-- Default privileges pra tabelas futuras criadas no schema
alter default privileges in schema public
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant execute on functions
  to anon, authenticated, service_role;
