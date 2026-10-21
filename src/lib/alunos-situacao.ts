export type StatusAluno = "frequente" | "matriculado" | "inativo" | "desistente";

export type MatriculaSituacao = {
  id: string;
  curso_id: string;
  turma_id?: string | null;
  data_matricula?: string | null;
  desistiu_em?: string | null;
};

export type RegistroFrequenciaAluno = {
  id: string;
  aluno_id: string;
  curso_id: string | null;
  turma_id: string | null;
  data_hora: string;
  status: string | null;
};

export const STATUS_ALUNO: Record<StatusAluno, { label: string; cor: string }> = {
  frequente: { label: "Frequente", cor: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  matriculado: { label: "Matriculado · não frequente", cor: "border-yellow-300 bg-yellow-50 text-yellow-800" },
  inativo: { label: "Cadastro inativo", cor: "border-slate-200 bg-slate-100 text-slate-600" },
  desistente: { label: "Desistiu do curso", cor: "border-red-200 bg-red-50 text-red-700" },
};

export function normalizarBusca(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const formatoDia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bahia" });

function diaBrasil(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "" : formatoDia.format(data);
}

export function indexarFrequencias(registros: RegistroFrequenciaAluno[]) {
  const indice = new Map<string, RegistroFrequenciaAluno[]>();
  for (const registro of registros) {
    const lista = indice.get(registro.aluno_id) ?? [];
    lista.push(registro);
    indice.set(registro.aluno_id, lista);
  }
  return indice;
}

export function calcularSituacaoAluno(
  matriculas: MatriculaSituacao[],
  registros: RegistroFrequenciaAluno[],
  limite = 30,
  agora = Date.now(),
) {
  const ativas = matriculas.filter((matricula) => !matricula.desistiu_em);
  const desistencias = matriculas.filter((matricula) => !!matricula.desistiu_em).length;
  const inicios = new Map<string, string>();
  for (const matricula of ativas) {
    const chave = matricula.turma_id ? `turma:${matricula.turma_id}` : `curso:${matricula.curso_id}`;
    const inicio = matricula.data_matricula ? diaBrasil(matricula.data_matricula) : "";
    const anterior = inicios.get(chave);
    if (anterior === undefined || inicio < anterior) inicios.set(chave, inicio);
  }
  // Uma chamada por aluno, turma e dia. Uma correção posterior substitui a anterior.
  const chamadas = new Map<string, RegistroFrequenciaAluno>();
  for (const registro of registros) {
    const data = new Date(registro.data_hora).getTime();
    if (!Number.isFinite(data) || data > agora) continue;
    const dia = diaBrasil(registro.data_hora);
    const inicioTurma = inicios.get(`turma:${registro.turma_id}`);
    const inicioCurso = inicios.get(`curso:${registro.curso_id}`);
    const pertence = (inicioTurma !== undefined && dia >= inicioTurma) ||
      (inicioCurso !== undefined && dia >= inicioCurso);
    if (!pertence) continue;
    const status = normalizarBusca(registro.status ?? "presente");
    if (!["presente", "presenca", "falta", "ausente"].includes(status)) continue;
    const chave = `${registro.turma_id ?? registro.curso_id}:${dia}`;
    const anterior = chamadas.get(chave);
    const dataAnterior = anterior ? new Date(anterior.data_hora).getTime() : 0;
    if (!anterior || data > dataAnterior || (data === dataAnterior && registro.id > anterior.id)) {
      chamadas.set(chave, registro);
    }
  }
  const total = chamadas.size;
  const presentes = [...chamadas.values()].filter((registro) =>
    ["presente", "presenca"].includes(normalizarBusca(registro.status ?? "presente")),
  ).length;
  const percentual = total ? (presentes / total) * 100 : null;
  const status: StatusAluno = !ativas.length
    ? (desistencias ? "desistente" : "inativo")
    : percentual !== null && percentual >= limite ? "frequente" : "matriculado";

  return { status, percentual, presentes, faltas: total - presentes, total, desistencias };
}
