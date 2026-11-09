"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, RefreshCw, SlidersHorizontal, FileText, Search, RotateCcw, Users, GraduationCap, UserCheck, Activity, ChevronLeft, ChevronRight, Sun, Moon, ArrowUpRight } from "lucide-react";
import { analisarDashboard, FILTROS_DASHBOARD_PADRAO, FAIXAS_ETARIAS_DASHBOARD, SITUACOES_DASHBOARD, type DadosDashboard, type FiltrosDashboard } from "@/lib/dashboard-analise";
import { carregarDadosDashboard } from "@/lib/dashboard-dados";
import { montarRelatorioDashboard } from "@/lib/dashboard-relatorio";
import { CONFIGURACAO_PADRAO, type ConfiguracaoRelatorio } from "@/lib/relatorios-exportacao";
import { DonutSituacoes, ComparativoCursos, EvolucaoMensal, MapaCalor } from "./GraficosDashboard";
import { RelatorioDashboard } from "./RelatorioDashboard";
import "./dashboard.css";

const CORES: Record<string, string> = { frequente: "#10b981", matriculado: "#eab308", inativo: "#94a3b8", desistente: "#f43f5e", encerrado: "#818cf8" };
const STATUS = Object.fromEntries(SITUACOES_DASHBOARD.map(s => [s.id, s.label]));
const numero = (n: number) => n.toLocaleString("pt-BR");
const taxa = (n: number | null) => n === null ? "Sem chamadas" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
function Campo({ nome, children }: { nome: string; children: ReactNode }) { return <label className="bi-field"><span>{nome}</span>{children}</label>; }
function Painel({ titulo, detalhe, children }: { titulo: string; detalhe: string; children: ReactNode }) { return <section className="bi-panel"><header><h2>{titulo}</h2><p>{detalhe}</p></header>{children}</section>; }
function MultiFiltro({ nome, itens, valor, onChange }: { nome: string; itens: { id: string; nome: string }[]; valor: string[]; onChange: (valor: string[]) => void }) {
  const [busca, setBusca] = useState("");
  return <details className="bi-multiselect"><summary><span>{nome}</span><strong>{valor.length ? `${valor.length} selecionado(s)` : "Todos"}</strong></summary><div className="bi-multi-options"><input aria-label={`Buscar ${nome.toLowerCase()}`} placeholder="Pesquisar opções…" value={busca} onChange={e => setBusca(e.target.value)} /><button type="button" onClick={() => onChange([])}>Limpar seleção</button>{itens.filter(i => i.nome.toLocaleLowerCase().includes(busca.toLocaleLowerCase())).map(i => <label key={i.id}><input type="checkbox" checked={valor.includes(i.id)} onChange={() => onChange(valor.includes(i.id) ? valor.filter(id => id !== i.id) : [...valor, i.id])} />{i.nome}</label>)}{!itens.length && <p>Nenhuma opção disponível.</p>}</div></details>;
}

export default function DashboardClient() {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [filtros, setFiltros] = useState<FiltrosDashboard>(FILTROS_DASHBOARD_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [atualizado, setAtualizado] = useState("");
  const [aba, setAba] = useState<"visao" | "alunos" | "relatorio">("visao");
  const [pagina, setPagina] = useState(0);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoRelatorio>({ ...CONFIGURACAO_PADRAO, titulo: "Relatório de gestão · São Brás", graficos: ["distribuicao", "cursos"] });
  const [fundo, setFundo] = useState("sistema");
  useEffect(() => {
    // Restore browser-only preferences after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).get("view") === "relatorio") setAba("relatorio");
    try { const salvo = localStorage.getItem("saobras-dashboard-fundo"); if (salvo === "light" || salvo === "dark") setFundo(salvo); } catch { /* Preferência opcional. */ }
  }, []);
  useEffect(() => {
    const controle = new AbortController();

    carregarDadosDashboard(controle.signal).then(novos => {
      if (controle.signal.aborted) return;
      setDados(novos); setAtualizado(new Date().toISOString());
    }).catch(e => { if (!controle.signal.aborted) setErro(e instanceof Error ? e.message : "Não foi possível carregar os dados."); })
      .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
    return () => controle.abort();
  }, [revisao]);
  const alterar = useCallback((mudanca: Partial<FiltrosDashboard>) => { setFiltros(f => ({ ...f, ...mudanca })); setPagina(0); }, []);
  const analise = useMemo(() => dados ? analisarDashboard(dados, filtros) : null, [dados, filtros]);
  const dataInvalida = !!(filtros.dataInicio && filtros.dataFim && filtros.dataInicio > filtros.dataFim);
  const indisponivel = carregando || !!erro || dataInvalida || !analise;
  const relatorio = useMemo(() => dados && analise ? montarRelatorioDashboard(dados, analise, filtros, configuracao, new Date().toISOString()) : null, [dados, analise, filtros, configuracao]);
  const turmasDisponiveis = dados?.turmas.filter(t => !filtros.cursoIds.length || filtros.cursoIds.includes(t.curso_id)) ?? [];
  const valores = (campo: "turno" | "bairro" | "municipio" | "metodo") => [...new Set((campo === "turno" ? dados?.turmas.map(t => t.turno) : campo === "metodo" ? dados?.presencas.map(p => p.metodo) : dados?.alunos.map(a => a[campo]))?.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  function periodo(dias: number | null) {
    if (!dias) { alterar({ dataInicio: "", dataFim: "" }); return; }
    const fim = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bahia" }).format(new Date());
    const inicio = new Date(`${fim}T12:00:00-03:00`); inicio.setUTCDate(inicio.getUTCDate() - dias + 1);
    alterar({ dataInicio: inicio.toISOString().slice(0, 10), dataFim: fim });
  }
  function selecionarCurso(id: string) { alterar({ cursoIds: filtros.cursoIds.includes(id) ? filtros.cursoIds.filter(v => v !== id) : [...filtros.cursoIds, id], turmaIds: [] }); }
  const chips = [
    ...filtros.cursoIds.map(id => ({ label: dados?.cursos.find(c => c.id === id)?.titulo ?? id, limpar: () => alterar({ cursoIds: filtros.cursoIds.filter(v => v !== id), turmaIds: [] }) })),
    ...filtros.turmaIds.map(id => ({ label: dados?.turmas.find(t => t.id === id)?.nome ?? id, limpar: () => alterar({ turmaIds: filtros.turmaIds.filter(v => v !== id) }) })),
    ...(filtros.statusAluno ? [{ label: STATUS[filtros.statusAluno], limpar: () => alterar({ statusAluno: "" }) }] : []),
  ];
  return <div className="dashboard-bi" data-fundo={fundo}>
    <header className="bi-heading"><div><div className="bi-eyebrow"><span />INTELIGÊNCIA DE GESTÃO</div><h1>Dashboard Interativo</h1><p>Explore os dados da instituição e transforme sua análise em relatório.</p></div><div className="bi-heading-actions"><div className="bi-theme" role="group" aria-label="Fundo do dashboard">{[["sistema", "Sistema"], ["light", "Claro"], ["dark", "Escuro"]].map(([id, nome]) => <button key={id} type="button" aria-pressed={fundo === id} onClick={() => { setFundo(id); try { localStorage.setItem("saobras-dashboard-fundo", id); } catch { /* Sem armazenamento. */ } }}>{id === "light" ? <Sun size={14} /> : id === "dark" ? <Moon size={14} /> : null}{nome}</button>)}</div><button className="bi-button" disabled={carregando} onClick={() => { setCarregando(true); setErro(""); setRevisao(r => r + 1); }}><RefreshCw size={16} className={carregando ? "bi-spin" : ""} />Atualizar</button><button className="bi-button bi-primary" onClick={() => setAba("relatorio")}><FileText size={16} />Criar relatório</button></div></header>
    <section className="bi-filter-panel" aria-label="Filtros do dashboard e relatório"><div className="bi-filter-title"><span><SlidersHorizontal size={17} />Filtros da análise</span><button type="button" onClick={() => { setFiltros(FILTROS_DASHBOARD_PADRAO); setPagina(0); }}><RotateCcw size={14} />Limpar filtros</button></div>
      <div className="bi-filters"><Campo nome="Pesquisar aluno"><div className="bi-search"><Search size={16} /><input value={filtros.busca} onChange={e => alterar({ busca: e.target.value })} placeholder="Nome do aluno…" /></div></Campo><MultiFiltro nome="Cursos" itens={dados?.cursos.map(c => ({ id: c.id, nome: c.titulo })) ?? []} valor={filtros.cursoIds} onChange={cursoIds => alterar({ cursoIds, turmaIds: [] })} /><MultiFiltro nome="Turmas" itens={turmasDisponiveis} valor={filtros.turmaIds} onChange={turmaIds => alterar({ turmaIds })} /><Campo nome="Visão dos dados"><select value={filtros.escopo} onChange={e => alterar({ escopo: e.target.value as FiltrosDashboard["escopo"] })}><option value="historico">Histórico completo</option><option value="ativos">Matrículas ativas</option></select></Campo></div>
      <div className="bi-period"><span>Período das chamadas</span><div className="bi-shortcuts"><button onClick={() => periodo(null)}>Todo o período</button><button onClick={() => periodo(7)}>7 dias</button><button onClick={() => periodo(30)}>30 dias</button><button onClick={() => periodo(90)}>90 dias</button></div><Campo nome="De"><input type="date" value={filtros.dataInicio} onChange={e => alterar({ dataInicio: e.target.value })} /></Campo><Campo nome="Até"><input type="date" value={filtros.dataFim} onChange={e => alterar({ dataFim: e.target.value })} /></Campo></div>
      <details className="bi-advanced"><summary>Mais filtros <span>· situação, idade, localização e chamadas</span></summary><div className="bi-filters bi-advanced-grid"><Campo nome="Situação do aluno"><select value={filtros.statusAluno} onChange={e => alterar({ statusAluno: e.target.value as FiltrosDashboard["statusAluno"] })}><option value="">Todas as situações</option>{SITUACOES_DASHBOARD.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Campo><Campo nome="Frequência mínima"><select value={filtros.frequenciaMinima} onChange={e => alterar({ frequenciaMinima: Number(e.target.value) as 30 | 40 })}><option value="30">30% ou mais</option><option value="40">40% ou mais</option></select></Campo><Campo nome="Situação da turma"><select value={filtros.situacaoTurma} onChange={e => alterar({ situacaoTurma: e.target.value })}><option value="">Todas</option>{[...new Set(dados?.turmas.map(t => t.status).filter((s): s is string => !!s))].map(s => <option key={s}>{s}</option>)}</select></Campo><Campo nome="Turno"><select value={filtros.turno} onChange={e => alterar({ turno: e.target.value })}><option value="">Todos</option>{valores("turno").map(v => <option key={v}>{v}</option>)}</select></Campo><Campo nome="Faixa etária"><select value={filtros.faixaEtaria} onChange={e => alterar({ faixaEtaria: e.target.value })}><option value="">Todas</option>{FAIXAS_ETARIAS_DASHBOARD.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></Campo>{(["municipio", "bairro"] as const).map(c => <Campo key={c} nome={c === "bairro" ? "Bairro" : "Município"}><select value={filtros[c]} onChange={e => alterar({ [c]: e.target.value })}><option value="">Todos</option>{valores(c).map(v => <option key={v}>{v}</option>)}</select></Campo>)}<Campo nome="Operador da chamada"><select value={filtros.operadorId} onChange={e => alterar({ operadorId: e.target.value })}><option value="">Todos</option>{dados?.operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Campo><Campo nome="Método de registro"><select value={filtros.metodo} onChange={e => alterar({ metodo: e.target.value })}><option value="">Todos</option>{valores("metodo").map(v => <option key={v}>{v}</option>)}</select></Campo></div></details>
      <div className="bi-filter-foot"><p>Filtros aplicados automaticamente. As datas recortam as chamadas; cadastros e matrículas representam o grupo selecionado. A situação da matrícula é a atual.</p>{chips.length > 0 && <div className="bi-chips">{chips.map((c, i) => <button key={i} onClick={c.limpar} aria-label={`Remover filtro ${c.label}`}>{c.label}<span aria-hidden="true">×</span></button>)}</div>}</div>
    </section>
    <div className="bi-tabbar"><div role="tablist" aria-label="Visões da análise">{([["visao", "Visão geral", BarChart3], ["alunos", "Alunos e turmas", Users], ["relatorio", "Relatório e exportação", FileText]] as const).map(([id, label, Icon]) => <button key={id} role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={aba === id} onClick={() => setAba(id)}><Icon size={17} />{label}</button>)}</div><span>{atualizado ? `Atualizado às ${new Date(atualizado).toLocaleTimeString("pt-BR", { timeZone: "America/Bahia", hour: "2-digit", minute: "2-digit" })}` : "Carregando dados…"}</span></div>
    {dataInvalida && <div className="bi-error" role="alert">A data inicial deve ser anterior ou igual à data final.</div>}
    {erro && <div className="bi-error" role="alert">{erro} Os indicadores e a exportação ficam indisponíveis até uma consulta completa.</div>}
    {carregando && <div className="bi-loading" role="status"><RefreshCw size={22} className="bi-spin" />Reunindo cadastros, matrículas e chamadas…</div>}
    {!indisponivel && analise && aba !== "relatorio" && <div role="tabpanel" id={`panel-${aba}`} aria-labelledby={`tab-${aba}`}>
      <div className="bi-kpis">{[
        ["Cadastros no recorte", analise.kpis.totalCadastrados, "Pessoas únicas, incluindo inativas", Users, "blue"],
        ["Alunos atendidos", analise.kpis.alunosAtendidos, "Com matrícula registrada no histórico", GraduationCap, "violet"],
        ["Alunos ativos", analise.kpis.alunosAtivos, "Com pelo menos uma matrícula ativa", UserCheck, "teal"],
        ["Alunos frequentes", analise.kpis.alunosFrequentes, `Ativos com frequência ≥ ${filtros.frequenciaMinima}%`, Activity, "green"],
      ].map(([label, value, hint, Icon, color]) => { const I = Icon as typeof Users; return <article key={String(label)} className={`bi-kpi bi-${color}`}><div><span>{String(label)}</span><I size={20} /></div><strong>{numero(Number(value))}</strong><p>{String(hint)}</p></article>; })}</div>
      {analise.avisos.length > 0 && <details className="bi-data-notes"><summary>Sobre a qualidade dos dados ({analise.avisos.length})</summary>{analise.avisos.map(a => <p key={a}>{a}</p>)}</details>}
      {aba === "visao" ? <><div className="bi-metrics"><span><i style={{ background: "#10b981" }} />{numero(analise.kpis.presencas)} presenças</span><span><i style={{ background: "#f43f5e" }} />{numero(analise.kpis.faltas)} faltas</span><span>Taxa de presença <b>{taxa(analise.kpis.frequencia)}</b></span><span>{numero(analise.kpis.desistentes)} alunos com desistência</span></div><div className="bi-chart-grid"><Painel titulo="Situação dos alunos" detalhe="Clique em uma situação para filtrar toda a análise."><DonutSituacoes items={analise.situacoes.map(s => ({ id: s.id, label: s.label, value: s.total, color: CORES[s.id] }))} selected={filtros.statusAluno} onSelect={id => alterar({ statusAluno: filtros.statusAluno === id ? "" : id as FiltrosDashboard["statusAluno"] })} /></Painel><Painel titulo="Participação por curso" detalhe="Presenças e faltas no período. Clique para selecionar cursos."><ComparativoCursos items={analise.cursos.map(c => ({ id: c.id, label: c.nome, alunos: c.alunos, presencas: c.presencas, faltas: c.faltas }))} selectedIds={filtros.cursoIds} onSelect={selecionarCurso} /></Painel><Painel titulo="Evolução ao longo do tempo" detalhe="Chamadas e novos cadastros por mês, conforme o período selecionado."><EvolucaoMensal items={analise.evolucao} /></Painel><Painel titulo="Mapa de atividade" detalhe="Volume de chamadas por dia da semana e turno da turma."><MapaCalor items={analise.mapaCalor} /></Painel></div><div className="bi-chart-grid"><Painel titulo="Perfil etário" detalhe="Idade atual; cadastros sem informação aparecem separadamente."><div className="bi-age-bars">{analise.faixasEtarias.map(f => <button key={f.id} onClick={() => alterar({ faixaEtaria: filtros.faixaEtaria === f.id ? "" : f.id })} aria-pressed={filtros.faixaEtaria === f.id}><span>{f.label}</span><div><i style={{ width: `${f.total / Math.max(1, ...analise.faixasEtarias.map(a => a.total)) * 100}%` }} /></div><b>{f.total}</b></button>)}</div></Painel><Painel titulo="Aprofunde sua análise" detalhe="Os mesmos filtros acompanham cada etapa."><div className="bi-next"><p>Consulte os alunos por nome, compare turmas e escolha as informações que entrarão no documento.</p><button className="bi-button" onClick={() => setAba("alunos")}>Explorar alunos e turmas<ArrowUpRight size={16} /></button><button className="bi-button bi-primary" onClick={() => setAba("relatorio")}>Montar e pré-visualizar relatório<FileText size={16} /></button></div></Painel></div></> : <>
        <Painel titulo="Alunos do recorte" detalhe={`${analise.alunos.length} pessoas únicas. Frequência inclui as chamadas do recorte; a situação considera apenas matrículas atualmente ativas.`}><div className="bi-table-scroll"><table><thead><tr><th>Aluno</th><th>Situação atual</th><th>Matrículas</th><th>Presenças</th><th>Faltas</th><th>Frequência</th></tr></thead><tbody>{analise.alunos.slice(pagina * 25, pagina * 25 + 25).map(a => <tr key={a.id}><td>{a.nome}</td><td><span className="bi-status" style={{ color: CORES[a.status] }}>{STATUS[a.status]}</span></td><td>{a.matriculas}</td><td>{a.presencas}</td><td>{a.faltas}</td><td>{taxa(a.frequencia)}</td></tr>)}</tbody></table>{!analise.alunos.length && <p className="bi-empty">Nenhum aluno corresponde aos filtros.</p>}</div><div className="bi-pagination"><button className="bi-button" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button><span>Página {pagina + 1} de {Math.max(1, Math.ceil(analise.alunos.length / 25))}</span><button className="bi-button" disabled={(pagina + 1) * 25 >= analise.alunos.length} onClick={() => setPagina(p => p + 1)} aria-label="Próxima página"><ChevronRight size={16} /></button></div></Painel><Painel titulo="Comparação de turmas" detalhe="Clique no nome de uma turma para aplicar o filtro. Ocupação usa apenas matrículas ativas."><div className="bi-table-scroll"><table><thead><tr><th>Turma</th><th>Alunos</th><th>Ativos</th><th>Vagas</th><th>Ocupação atual</th><th>Frequência</th></tr></thead><tbody>{analise.turmas.map(t => <tr key={t.id}><td><button className="bi-text-button" onClick={() => alterar({ turmaIds: filtros.turmaIds.includes(t.id) ? filtros.turmaIds.filter(id => id !== t.id) : [...filtros.turmaIds, t.id] })}>{t.nome}</button></td><td>{t.alunos}</td><td>{t.ativos}</td><td>{t.vagas || "Não informadas"}</td><td>{t.vagas ? taxa(t.ocupacao) : "—"}</td><td>{taxa(t.frequencia)}</td></tr>)}</tbody></table></div></Painel>
      </>}
    </div>}
    {aba === "relatorio" && <div role="tabpanel" id="panel-relatorio" aria-labelledby="tab-relatorio"><RelatorioDashboard relatorio={relatorio} configuracao={configuracao} onChange={setConfiguracao} indisponivel={indisponivel} /></div>}
    <footer className="bi-footer">Uma pessoa é contada uma vez por indicador. Frequência = presenças ÷ chamadas válidas; ausência de chamadas não significa falta. Horários em America/Bahia.</footer>
  </div>;
}
