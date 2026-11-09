/** Pure, deterministic analysis shared by the dashboard and its report snapshot. */
export type StatusAlunoDashboard = "frequente" | "matriculado" | "inativo" | "desistente" | "encerrado";
export type AlunoDashboard = {
  id: string; nome_completo: string; status_estudante?: boolean | null;
  criado_em?: string | null; data_nascimento?: string | null; idade?: number | null;
  bairro?: string | null; municipio?: string | null;
};
export type CursoDashboard = { id: string; titulo: string };
export type TurmaDashboard = {
  id: string; nome: string; curso_id: string; status?: string | null;
  turno?: string | null; horario?: string | null; vagas?: number | null;
};
export type MatriculaDashboard = {
  id: string; aluno_id: string; curso_id: string; turma_id?: string | null;
  data_matricula?: string | null; encerrada_em?: string | null; desistiu_em?: string | null;
};
export type PresencaDashboard = {
  id: string; aluno_id: string; curso_id: string | null; turma_id: string | null;
  data_hora: string; status: string | null; operador_id?: string | null; metodo?: string | null;
};
export type OperadorDashboard = { id: string; nome: string };
export type DadosDashboard = {
  alunos: AlunoDashboard[]; cursos: CursoDashboard[]; turmas: TurmaDashboard[];
  matriculas: MatriculaDashboard[]; presencas: PresencaDashboard[]; operadores: OperadorDashboard[];
};
export type FiltrosDashboard = {
  cursoIds: string[]; turmaIds: string[]; statusAluno: StatusAlunoDashboard | "";
  situacaoTurma: string; turno: string; operadorId: string; metodo: string;
  busca: string; dataInicio: string; dataFim: string; frequenciaMinima: 30 | 40;
  faixaEtaria: string; escopo: "historico" | "ativos"; bairro: string; municipio: string;
};
export const FILTROS_DASHBOARD_PADRAO: FiltrosDashboard = {
  cursoIds: [], turmaIds: [], statusAluno: "", situacaoTurma: "", turno: "",
  operadorId: "", metodo: "", busca: "", dataInicio: "", dataFim: "",
  frequenciaMinima: 30, faixaEtaria: "", escopo: "historico", bairro: "", municipio: "",
};
export const SITUACOES_DASHBOARD: { id: StatusAlunoDashboard; label: string }[] = [
  { id: "frequente", label: "Frequente" },
  { id: "matriculado", label: "Matriculado · não frequente" },
  { id: "inativo", label: "Cadastro inativo" },
  { id: "desistente", label: "Desistiu do curso" },
  { id: "encerrado", label: "Matrículas encerradas" },
];
export const FAIXAS_ETARIAS_DASHBOARD = [
  { id: "0-17", label: "Até 17 anos" }, { id: "18-29", label: "18 a 29 anos" },
  { id: "30-59", label: "30 a 59 anos" }, { id: "60+", label: "60 anos ou mais" },
  { id: "nao-informada", label: "Idade não informada" },
];
export type AlunoResumoDashboard = {
  id: string; nome: string; idade: number | null; status: StatusAlunoDashboard;
  frequencia: number | null; frequenciaAtiva: number | null; presencas: number; faltas: number;
  matriculas: number; matriculasAtivas: number; desistencias: number; cursos: string[]; turmas: string[];
};
export type GrupoDashboard = {
  id: string; nome: string; alunos: number; matriculas: number; ativos: number;
  presencas: number; faltas: number; frequencia: number | null; vagas: number; ocupacao: number | null;
};
export type EvolucaoDashboard = { mes: string; label: string; cadastros: number; matriculas: number; presencas: number; faltas: number };
export type CelulaCalorDashboard = { dia: number; diaSemana: string; turno: string; total: number; presencas: number; faltas: number };

const formatoDia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bahia", year: "numeric", month: "2-digit", day: "2-digit" });
export function diaDashboard(valor: string | Date): string {
  // A stored date-only value already names a local calendar date.
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const data = new Date(`${valor}T12:00:00Z`);
    return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor ? valor : "";
  }
  const data = new Date(valor);
  if (!Number.isFinite(data.getTime())) return "";
  const partes = formatoDia.formatToParts(data);
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}
function normalizar(valor: string | null | undefined) {
  return (valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
export function statusPresencaDashboard(valor: string | null): "presente" | "falta" | null {
  const status = normalizar(valor ?? "presente");
  if (["presente", "presenca"].includes(status)) return "presente";
  if (["falta", "ausente"].includes(status)) return "falta";
  return null;
}
function percentual(presencas: number, total: number) { return total ? presencas * 100 / total : null; }
function idadeAluno(aluno: AlunoDashboard, hoje: string): number | null {
  if (aluno.data_nascimento) {
    const nascimento = diaDashboard(aluno.data_nascimento);
    if (!nascimento || nascimento > hoje) return null;
    return Number(hoje.slice(0, 4)) - Number(nascimento.slice(0, 4)) - (hoje.slice(5) < nascimento.slice(5) ? 1 : 0);
  }
  return typeof aluno.idade === "number" && aluno.idade >= 0 && Number.isFinite(aluno.idade) ? aluno.idade : null;
}
function faixaId(idade: number | null) {
  return idade === null ? "nao-informada" : idade < 18 ? "0-17" : idade < 30 ? "18-29" : idade < 60 ? "30-59" : "60+";
}
function unicos<T extends { id: string }>(itens: T[]): T[] { return [...new Map(itens.map((i) => [i.id, i])).values()]; }
function contar(registros: PresencaDashboard[]) {
  let presencas = 0, faltas = 0;
  for (const registro of registros) {
    const status = statusPresencaDashboard(registro.status);
    if (status === "presente") presencas++;
    if (status === "falta") faltas++;
  }
  return { presencas, faltas, frequencia: percentual(presencas, presencas + faltas) };
}

export function analisarDashboard(dados: DadosDashboard, filtros: FiltrosDashboard = FILTROS_DASHBOARD_PADRAO, agora = new Date()) {
  const hoje = diaDashboard(agora);
  const avisos: string[] = [];
  const alunosBase = unicos(dados.alunos);
  const matriculasBase = unicos(dados.matriculas);
  const cursosBase = unicos(dados.cursos);
  const turmasBase = unicos(dados.turmas);
  const porAluno = new Map(alunosBase.map((a) => [a.id, a]));
  const porTurma = new Map(turmasBase.map((t) => [t.id, t]));
  const porCurso = new Map(cursosBase.map((c) => [c.id, c]));
  const cursosSelecionados = new Set(filtros.cursoIds);
  const turmasSelecionadas = new Set(filtros.turmaIds);
  const ativa = (m: MatriculaDashboard) => !m.encerrada_em && !m.desistiu_em &&
    porAluno.get(m.aluno_id)?.status_estudante === true && porTurma.get(m.turma_id ?? "")?.status === "ativa";
  const correspondeAcademico = (cursoId: string | null, turmaId: string | null | undefined) => {
    const turma = porTurma.get(turmaId ?? "");
    return (!cursosSelecionados.size || cursosSelecionados.has(cursoId ?? turma?.curso_id ?? "")) &&
      (!turmasSelecionadas.size || turmasSelecionadas.has(turmaId ?? "")) &&
      (!filtros.situacaoTurma || turma?.status === filtros.situacaoTurma) &&
      (!filtros.turno || turma?.turno === filtros.turno);
  };
  const possuiFiltroAcademico = !!(cursosSelecionados.size || turmasSelecionadas.size || filtros.situacaoTurma || filtros.turno);
  const matriculasAcademicas = matriculasBase.filter((m) => correspondeAcademico(m.curso_id, m.turma_id) &&
    (filtros.escopo !== "ativos" || ativa(m)));
  const matriculasPorAluno = new Map<string, MatriculaDashboard[]>();
  for (const matricula of matriculasAcademicas) {
    const lista = matriculasPorAluno.get(matricula.aluno_id) ?? [];
    lista.push(matricula); matriculasPorAluno.set(matricula.aluno_id, lista);
  }

  const datasValidas = (!filtros.dataInicio || diaDashboard(filtros.dataInicio) === filtros.dataInicio) &&
    (!filtros.dataFim || diaDashboard(filtros.dataFim) === filtros.dataFim) &&
    (!filtros.dataInicio || !filtros.dataFim || filtros.dataInicio <= filtros.dataFim);
  if (!datasValidas) avisos.push("Período inválido: revise as datas inicial e final.");
  const noPeriodo = (dia: string) => !!dia && datasValidas && (!filtros.dataInicio || dia >= filtros.dataInicio) && (!filtros.dataFim || dia <= filtros.dataFim);
  // One attendance per learner, class (or legacy course) and Bahia calendar day.
  // Resolve corrections before operator/method filters so an obsolete value cannot reappear.
  const chamadas = new Map<string, PresencaDashboard>();
  for (const registro of unicos(dados.presencas)) {
    const instante = new Date(registro.data_hora).getTime();
    const dia = diaDashboard(registro.data_hora);
    if (!Number.isFinite(instante) || instante > agora.getTime() || !noPeriodo(dia)) continue;
    if (!correspondeAcademico(registro.curso_id, registro.turma_id)) continue;
    const chave = `${registro.aluno_id}:${registro.turma_id ? `t:${registro.turma_id}` : `c:${registro.curso_id}`}:${dia}`;
    const anterior = chamadas.get(chave);
    if (!anterior || instante > new Date(anterior.data_hora).getTime() ||
      (instante === new Date(anterior.data_hora).getTime() && registro.id > anterior.id)) chamadas.set(chave, registro);
  }
  const pertenceAtiva = (registro: PresencaDashboard, matriculas: MatriculaDashboard[]) => matriculas.some((m) => {
    if (!ativa(m)) return false;
    const corresponde = m.turma_id ? m.turma_id === registro.turma_id : m.curso_id === registro.curso_id;
    const inicio = m.data_matricula ? diaDashboard(m.data_matricula) : "";
    return corresponde && (!inicio || diaDashboard(registro.data_hora) >= inicio);
  });
  const registrosConsulta = [...chamadas.values()].filter((p) =>
    (!filtros.operadorId || p.operador_id === filtros.operadorId) &&
    (!filtros.metodo || p.metodo === filtros.metodo) &&
    (filtros.escopo !== "ativos" || pertenceAtiva(p, matriculasPorAluno.get(p.aluno_id) ?? [])));
  const registrosPorAluno = new Map<string, PresencaDashboard[]>();
  for (const registro of registrosConsulta) {
    const lista = registrosPorAluno.get(registro.aluno_id) ?? [];
    lista.push(registro); registrosPorAluno.set(registro.aluno_id, lista);
  }
  const termo = normalizar(filtros.busca);
  const alunos: AlunoResumoDashboard[] = [];
  for (const aluno of alunosBase) {
    const matriculas = matriculasPorAluno.get(aluno.id) ?? [];
    if ((possuiFiltroAcademico || filtros.escopo === "ativos") && !matriculas.length) continue;
    const idade = idadeAluno(aluno, hoje);
    if (filtros.faixaEtaria && faixaId(idade) !== filtros.faixaEtaria) continue;
    if (filtros.bairro && aluno.bairro !== filtros.bairro) continue;
    if (filtros.municipio && aluno.municipio !== filtros.municipio) continue;
    const cursos = [...new Set(matriculas.map((m) => porCurso.get(m.curso_id)?.titulo ?? "Curso não informado"))];
    const turmas = [...new Set(matriculas.map((m) => porTurma.get(m.turma_id ?? "")?.nome ?? "Sem turma"))];
    if (termo && !normalizar([aluno.nome_completo, ...cursos, ...turmas].join(" ")).includes(termo)) continue;
    const registrosAluno = registrosPorAluno.get(aluno.id) ?? [];
    if ((filtros.operadorId || filtros.metodo) && !registrosAluno.length) continue;
    const ativas = matriculas.filter(ativa);
    const frequenciaAtiva = contar(registrosAluno.filter((p) => pertenceAtiva(p, ativas)));
    const desistencias = matriculas.filter((m) => !!m.desistiu_em).length;
    const encerradas = matriculas.filter((m) => !m.desistiu_em && (!!m.encerrada_em || porTurma.get(m.turma_id ?? "")?.status === "encerrada")).length;
    const status: StatusAlunoDashboard = ativas.length
      ? frequenciaAtiva.frequencia !== null && frequenciaAtiva.frequencia >= filtros.frequenciaMinima ? "frequente" : "matriculado"
      : encerradas ? "encerrado" : desistencias ? "desistente" : "inativo";
    if (filtros.statusAluno && filtros.statusAluno !== status) continue;
    alunos.push({ id: aluno.id, nome: aluno.nome_completo, idade, status,
      ...contar(registrosAluno), frequenciaAtiva: frequenciaAtiva.frequencia,
      matriculas: matriculas.length, matriculasAtivas: ativas.length,
      desistencias, cursos, turmas });
  }
  alunos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const idsAlunos = new Set(alunos.map((a) => a.id));
  const matriculas = matriculasAcademicas.filter((m) => idsAlunos.has(m.aluno_id));
  const presencas = registrosConsulta.filter((p) => idsAlunos.has(p.aluno_id))
    .sort((a, b) => b.data_hora.localeCompare(a.data_hora) || b.id.localeCompare(a.id));
  const totais = contar(presencas);
  const naoClassificados = presencas.length - totais.presencas - totais.faltas;
  if (naoClassificados) avisos.push(`${naoClassificados} registro(s) com situação não reconhecida ficaram fora do cálculo de frequência.`);
  const idsAtendidos = new Set(matriculas.map((m) => m.aluno_id));
  const ativas = matriculas.filter(ativa);
  const kpis = {
    totalCadastrados: alunos.length, alunosAtendidos: idsAtendidos.size,
    alunosAtivos: new Set(ativas.map((m) => m.aluno_id)).size,
    alunosFrequentes: alunos.filter((a) => a.status === "frequente").length,
    desistentes: alunos.filter((a) => a.desistencias > 0).length,
    totalMatriculas: matriculas.length, matriculasAtivas: ativas.length,
    ...totais, registros: presencas.length, naoClassificados,
    alunosMultiplasTurmas: alunos.filter((a) => new Set((matriculasPorAluno.get(a.id) ?? []).filter(ativa).map((m) => m.turma_id).filter(Boolean)).size > 1).length,
  };
  function agrupar(tipo: "curso" | "turma"): GrupoDashboard[] {
    const itens = tipo === "curso" ? cursosBase.map((c) => ({ id: c.id, nome: c.titulo })) : turmasBase;
    return itens.filter((item) => tipo === "curso"
      ? (!cursosSelecionados.size || cursosSelecionados.has(item.id)) && (matriculas.some((m) => m.curso_id === item.id) || presencas.some((p) => p.curso_id === item.id))
      : correspondeAcademico(porTurma.get(item.id)?.curso_id ?? null, item.id) && (matriculas.some((m) => m.turma_id === item.id) || presencas.some((p) => p.turma_id === item.id)))
      .map((item) => {
        const matr = matriculas.filter((m) => (tipo === "curso" ? m.curso_id : m.turma_id) === item.id);
        const regs = presencas.filter((p) => (tipo === "curso" ? p.curso_id : p.turma_id) === item.id);
        const atuais = matr.filter(ativa);
        const turmas = turmasBase.filter((t) => (tipo === "curso" ? t.curso_id : t.id) === item.id && t.status === "ativa" && correspondeAcademico(t.curso_id, t.id));
        const vagas = turmas.reduce((total, t) => total + Math.max(0, Number(t.vagas) || 0), 0);
        // Distinct learner/class pairs fill seats; the same learner can occupy seats in two classes.
        const ocupadas = new Set(atuais.map((m) => `${m.aluno_id}:${m.turma_id}`)).size;
        return { id: item.id, nome: item.nome, alunos: new Set(matr.map((m) => m.aluno_id)).size,
          matriculas: matr.length, ativos: new Set(atuais.map((m) => m.aluno_id)).size,
          ...contar(regs), vagas, ocupacao: percentual(ocupadas, vagas) };
      }).sort((a, b) => b.alunos - a.alunos || a.nome.localeCompare(b.nome, "pt-BR"));
  }
  const mensal = new Map<string, EvolucaoDashboard>();
  const mesDe = (data: string | null | undefined) => {
    const dia = data ? diaDashboard(data) : "";
    if (!dia || dia > hoje || !noPeriodo(dia)) return null;
    const mes = dia.slice(0, 7);
    if (!mensal.has(mes)) mensal.set(mes, { mes, label: new Date(`${mes}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "America/Bahia" }), cadastros: 0, matriculas: 0, presencas: 0, faltas: 0 });
    return mensal.get(mes)!;
  };
  for (const aluno of alunosBase) if (idsAlunos.has(aluno.id)) { const mes = mesDe(aluno.criado_em); if (mes) mes.cadastros++; }
  for (const matricula of matriculas) { const mes = mesDe(matricula.data_matricula); if (mes) mes.matriculas++; }
  for (const registro of presencas) {
    const mes = mesDe(registro.data_hora), status = statusPresencaDashboard(registro.status);
    if (mes && status === "presente") mes.presencas++;
    if (mes && status === "falta") mes.faltas++;
  }
  const calor = new Map<string, CelulaCalorDashboard>();
  const turnos = [...new Set(presencas.map((p) => porTurma.get(p.turma_id ?? "")?.turno || "Não informado"))].sort();
  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let dia = 0; dia < 7; dia++) for (const turno of turnos) calor.set(`${dia}:${turno}`, { dia, diaSemana: dias[dia], turno, total: 0, presencas: 0, faltas: 0 });
  for (const registro of presencas) {
    const dia = new Date(`${diaDashboard(registro.data_hora)}T12:00:00Z`).getUTCDay();
    const turno = porTurma.get(registro.turma_id ?? "")?.turno || "Não informado";
    const celula = calor.get(`${dia}:${turno}`)!;
    const status = statusPresencaDashboard(registro.status);
    if (status === "presente") { celula.presencas++; celula.total++; }
    if (status === "falta") { celula.faltas++; celula.total++; }
  }
  return {
    alunos, matriculas, presencas, kpis, cursos: agrupar("curso"), turmas: agrupar("turma"),
    evolucao: [...mensal.values()].sort((a, b) => a.mes.localeCompare(b.mes)),
    mapaCalor: [...calor.values()],
    situacoes: SITUACOES_DASHBOARD.map((s) => ({ ...s, total: alunos.filter((a) => a.status === s.id).length })),
    faixasEtarias: FAIXAS_ETARIAS_DASHBOARD.map((f) => ({ ...f, total: alunos.filter((a) => faixaId(a.idade) === f.id).length })),
    avisos,
  };
}
export type AnaliseDashboard = ReturnType<typeof analisarDashboard>;
