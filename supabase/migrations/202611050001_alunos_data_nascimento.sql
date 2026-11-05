-- Executar antes de publicar a aplicação. Não altera a coluna idade nem seus valores.
begin;
alter table public.alunos
  add column if not exists data_nascimento date;

comment on column public.alunos.data_nascimento is
  'Nascimento confirmado do aluno. NULL para cadastros legados ainda não atualizados; nunca inferir a partir de idade.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.alunos'::regclass
      and conname = 'alunos_data_nascimento_valida'
  ) then
    alter table public.alunos add constraint alunos_data_nascimento_valida
      check (data_nascimento is null or
        (data_nascimento >= date '0001-01-01' and
         data_nascimento <= (current_timestamp at time zone 'America/Bahia')::date));
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
