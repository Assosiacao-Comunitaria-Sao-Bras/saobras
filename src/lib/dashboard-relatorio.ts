import { analisarDashboard, diaDashboard, statusPresencaDashboard, SITUACOES_DASHBOARD, type DadosDashboard, type FiltrosDashboard } from "./dashboard-analise";
import type { ConfiguracaoRelatorio, RelatorioExportacao, TabelaRelatorio, GraficoRelatorio } from "./relatorios-exportacao";

export function montarRelatorioDashboard(dados: DadosDashboard, analise: ReturnType<typeof analisarDashboard>, filtros: FiltrosDashboard, config: ConfiguracaoRelatorio, emitidoEm: string): RelatorioExportacao {
  const taxa = (v: number | null) => v === null ? "Sem chamadas" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  const nomeStatus = (id: string) => SITUACOES_DASHBOARD.find(s => s.id === id)?.label ?? id;
  const grupos = (titulo: string, itens: typeof analise.cursos): TabelaRelatorio => ({ titulo, colunas: ["Nome", "Alunos", "Matrículas", "Ativos", "Presenças", "Faltas", "Frequência"], linhas: itens.map(c => [c.nome, c.alunos, c.matriculas, c.ativos, c.presencas, c.faltas, taxa(c.frequencia)]) });
  const tabelas: Record<string, TabelaRelatorio> = {
    resumo: { titulo: "Resumo da análise", colunas: ["Indicador", "Valor"], linhas: [
      ["Cadastros no recorte", analise.kpis.totalCadastrados], ["Alunos com matrícula no histórico", analise.kpis.alunosAtendidos], ["Alunos ativos", analise.kpis.alunosAtivos], ["Alunos frequentes", analise.kpis.alunosFrequentes], ["Com desistência registrada", analise.kpis.desistentes], ["Presenças", analise.kpis.presencas], ["Faltas", analise.kpis.faltas], ["Taxa de presença", taxa(analise.kpis.frequencia)],
    ] },
    cursos: grupos("Análise por curso", analise.cursos), turmas: grupos("Análise por turma", analise.turmas),
    alunos: { titulo: "Alunos do recorte", colunas: ["Participante", "Situação atual", "Matrículas", "Presenças", "Faltas", "Frequência"], linhas: analise.alunos.map(a => [a.nome, nomeStatus(a.status), a.matriculas, a.presencas, a.faltas, taxa(a.frequencia)]) },
    registros: { titulo: "Chamadas do período", colunas: ["Participante", "Curso", "Turma", "Data", "Situação", "Operador", "Método"], linhas: analise.presencas.map(p => [dados.alunos.find(a => a.id === p.aluno_id)?.nome_completo ?? "Não informado", dados.cursos.find(c => c.id === p.curso_id)?.titulo ?? "Não informado", dados.turmas.find(t => t.id === p.turma_id)?.nome ?? "Sem turma", new Date(p.data_hora).toLocaleString("pt-BR", { timeZone: "America/Bahia" }), statusPresencaDashboard(p.status) ?? "Não classificada", dados.operadores.find(o => o.id === p.operador_id)?.nome ?? "Não informado", p.metodo ?? "Não informado"]) },
  };
  const dias = new Map<string, { rotulo: string; presencas: number; faltas: number }>();
  for (const p of analise.presencas) { const dia = diaDashboard(p.data_hora); const item = dias.get(dia) ?? { rotulo: dia, presencas: 0, faltas: 0 }; const status = statusPresencaDashboard(p.status); if (status === "presente") item.presencas++; if (status === "falta") item.faltas++; dias.set(dia, item); }
  const graficos: GraficoRelatorio[] = [
    { id: "distribuicao", titulo: "Presenças e faltas", descricao: "Chamadas válidas no recorte selecionado.", itens: [{ rotulo: "Total", presencas: analise.kpis.presencas, faltas: analise.kpis.faltas }] },
    { id: "cursos", titulo: "Comparação por curso", descricao: "Todos os cursos incluídos na análise.", itens: analise.cursos.map(c => ({ rotulo: c.nome, presencas: c.presencas, faltas: c.faltas })) },
    { id: "turmas", titulo: "Comparação por turma", descricao: "Todas as turmas incluídas na análise.", itens: analise.turmas.map(t => ({ rotulo: t.nome, presencas: t.presencas, faltas: t.faltas })) },
    { id: "dias", titulo: "Evolução por dia", descricao: "Chamadas agrupadas pelo dia em America/Bahia.", itens: [...dias.values()].sort((a,b) => a.rotulo.localeCompare(b.rotulo)) },
  ];
  return { titulo: config.titulo.trim(), emitidoEm, orientacao: config.orientacao, tabelas: config.secoes.map(s => tabelas[s]), graficos: graficos.filter(g => config.graficos.includes(g.id)), filtros: [
    `Visão: ${filtros.escopo === "ativos" ? "Matrículas ativas" : "Histórico completo"}`,
    `Chamadas: ${filtros.dataInicio || "início do histórico"} até ${filtros.dataFim || "hoje"}`,
    `Cursos: ${filtros.cursoIds.length ? filtros.cursoIds.map(id => dados.cursos.find(c => c.id === id)?.titulo ?? id).join(", ") : "Todos"}`,
    `Turmas: ${filtros.turmaIds.length ? filtros.turmaIds.map(id => dados.turmas.find(t => t.id === id)?.nome ?? id).join(", ") : "Todas"}`,
    `Situação: ${filtros.statusAluno ? nomeStatus(filtros.statusAluno) : "Todas"}; frequência mínima: ${filtros.frequenciaMinima}%`,
    ...Object.entries({ "Busca": filtros.busca, "Situação da turma": filtros.situacaoTurma, "Turno": filtros.turno, "Faixa etária": filtros.faixaEtaria, "Bairro": filtros.bairro, "Município": filtros.municipio, "Operador": dados.operadores.find(o => o.id === filtros.operadorId)?.nome || filtros.operadorId, "Método": filtros.metodo }).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`),
    "Datas recortam chamadas e evolução. Cadastros e matrículas representam o grupo selecionado, independentemente da data de ingresso. Situação atual; aluno frequente considera apenas chamadas de matrículas ativas.",
    ...analise.avisos,
  ] };
}
