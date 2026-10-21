-- Preserva a matrícula e seu histórico de frequência ao registrar a desistência.
-- As permissões existentes de UPDATE em matriculas continuam sendo utilizadas.
alter table public.matriculas
  add column if not exists desistiu_em timestamptz;

comment on column public.matriculas.desistiu_em is
  'Data da desistência explicitamente registrada. NULL indica matrícula sem desistência.';
