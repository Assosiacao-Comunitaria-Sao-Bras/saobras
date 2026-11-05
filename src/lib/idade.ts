export function hojeNaBahia(agora = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(agora);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export function calcularIdade(nascimento?: string | null, hoje = hojeNaBahia()): number | null {
  if (!nascimento || !/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) return null;
  const data = new Date(`${nascimento}T00:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== nascimento
    || nascimento < "0001-01-01" || nascimento > hoje) return null;
  const anos = Number(hoje.slice(0, 4)) - Number(nascimento.slice(0, 4));
  return anos - (hoje.slice(5) < nascimento.slice(5) ? 1 : 0);
}

export function idadeDoAluno(aluno: { data_nascimento?: string | null; idade?: number | null }, hoje = hojeNaBahia()): number | null {
  return aluno.data_nascimento ? calcularIdade(aluno.data_nascimento, hoje) : aluno.idade ?? null;
}
